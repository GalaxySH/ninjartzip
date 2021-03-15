import xlg from "../xlogger";
import { MessageService } from "../m";
import { Collection, DMChannel, Message, MessageAttachment, MessageOptions, NewsChannel, TextChannel } from "discord.js";
import fs from 'fs';
import Zip from 'jszip';
import fetch from 'node-fetch';
import moment from 'moment';

let tries = 0;
let working = false;
const maxfetch = parseInt(process.env.ZIP_REACHBACK || "0") || 1000;
async function getAllMessages(c: TextChannel | NewsChannel, m?: Collection<string, Message>): Promise<Collection<string, Message>> {
    const msgs = !m || !m.size ? await c.messages.fetch({ limit: 100 }) : await c.messages.fetch({ limit: 100, before: m.last()?.id });
    const messages = !m || !m.size ? msgs : m.concat(msgs);
    if (msgs.size > 98 && msgs.size < maxfetch) {
        return await getAllMessages(c, messages);
    }
    return messages;
}

export const service: MessageService = {
    name: "zip",
    text: true,
    async execute(client, message: Message) {
        try {
            if (working) return;
            const conf = JSON.parse(fs.readFileSync("./conf.json", 'utf-8'));

            if (message.channel.id !== conf.inputChannel || message.channel instanceof DMChannel || !message.attachments.size || !message.attachments.first()?.width) return;
            working = true;

            const messages = await getAllMessages(message.channel);
            if (!messages.size) {
                working = false;
                return;
            }

            interface AttDat {
                url: string;
                size: number;
            }
            const groups: AttDat[][] = [[]];
            let currGroup = 0;
            //const links: string[] = [];
            messages.forEach(m => {
                if (m.attachments.size) {
                    for (const att of m.attachments.array()) {
                        if (att.height && att.width && att.size < 50000000) {
                            //console.log(`${att.name} ${Math.round(groups[currGroup].reduce((p, c) => p + c.size, att.size))}`)
                            if (Math.round(groups[currGroup].reduce((p, c) => p + c.size, att.size)) > 8000000) {
                                groups.push([]);
                                currGroup++;
                            }
                            groups[currGroup].push({ url: att.url, size: att.size });
                        }
                    }
                }
            });

            conf.outputPaths = [];
            const attachments: MessageAttachment[] = [];
            const images: {img: Buffer, name: string}[] = [];
            let gi = 0;
            for await (const group of groups) {
                if (!group.length) continue;
                const zip = new Zip();
                zip.file("README.txt", `This is an automatically generated archive file.\n\nThe contents of this file are derived from a channel: #${message.channel.name} (${message.channel.id}).\n\nReport issues regarding this file or something related to ComradeRooskie#6969.`);
                const folder = zip.folder("images");
                if (!folder) {
                    working = false;
                    return;
                }
                for await (const att of group) {
                    const linkParts = att.url.split("/");
                    const name = linkParts[linkParts.length - 1];
                    const r = await fetch(att.url);
                    const i = await r.buffer();
                    images.push({img: i, name});
                    //fs.writeFileSync(`./media/${name}`, i);
                    folder.file(name, i);
                }
                const zipped = await zip.generateAsync({ type: "nodebuffer" });
                const outputName = `ninjartist_${moment().format('YYYY-MM-DD_HH-mm-ss')}${groups.length > 1 ? `_${gi + 1}` : ""}.zip`;
                const outputPath = `./zips/${outputName}`;
                fs.writeFileSync(outputPath, zipped);
                const attach = new MessageAttachment(outputPath);

                attachments.push(attach);
                gi++;
            }

            if (images.length && attachments.length > 1) {
                const zip = new Zip();
                zip.file("README.txt", `This is an automatically generated archive file.\n\nThe contents of this file are derived from a channel: #${message.channel.name} (${message.channel.id}).\n\nReport issues regarding this file or something related to ComradeRooskie#6969.`);
                const folder = zip.folder("images");
                if (!folder) {
                    working = false;
                    return;
                }
                for await (const i of images) {
                    folder.file(i.name, i.img);
                }
                const zipped = await zip.generateAsync({ type: "nodebuffer" });
                const outputName = `ninjartist_full.zip`;
                const outputPath = `./zips/${outputName}`;
                fs.writeFileSync(outputPath, zipped);
            }

            if (conf.outputChannel && attachments.length) {
                const outputChannel = message.client.channels.cache.get(conf.outputChannel);
                if (outputChannel) {
                    if (outputChannel instanceof TextChannel || outputChannel instanceof NewsChannel) {
                        conf.id += 1;
                        const mdat: MessageOptions = {
                            content: `Gallery v${conf.id}\nGenerated at ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
                            //files: [attachments[0]],
                            embed: {
                                color: process.env.INFO_COLOR,
                                description: `<:sminfo:818342088088354866> [Click here to download the full gallery easily](https://ninj.atlasatmos.net)`
                            },
                        }
                        try {
                            const updatedMessage = await outputChannel.send(mdat);
                            if (conf.outputMessages) {
                                try {
                                    for await (const m of conf.outputMessages) {
                                        const msg = await outputChannel.messages.fetch(m);
                                        if (msg && msg.deletable) {
                                            await msg.delete();
                                        }
                                    }
                                } catch (error) {
                                    //
                                }
                            }
                            if (updatedMessage && updatedMessage instanceof Message) {
                                conf.outputMessages = [updatedMessage.id];
                                conf.oMessageLink = updatedMessage.url;
                            }
                            //attachments.shift();
                            if (attachments.length) {
                                for await (const a of attachments) {
                                    const m = await outputChannel.send({
                                        files: [a],
                                    });
                                    conf.outputMessages.push(m.id);
                                }
                            }
                        } catch (error) {
                            if (error.message === "Request entity too large" || error.message === "The user aborted a request.") {
                                if (tries > 2) {
                                    await client.specials?.sendError(message.channel, `Error encountered when sending gallery. Maximum tries reached (3).`);
                                    tries = 0;
                                } else {
                                    await client.specials?.sendError(message.channel, `Error encountered when sending gallery. Retrying (${tries + 1}/3).`);
                                    tries++;
                                    working = false;
                                    this.execute(client, message);
                                }
                            } else {
                                await client.specials?.sendError(message.channel, `Error encountered when sending gallery. Not retrying for this type of error.`);
                            }
                            xlg.error(error);
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        /*let updatedMessage: any;
                        if (conf.outputMessage) {
                            try {
                                const msg = await outputChannel.messages.fetch(conf.outputMessage);
                                if (msg && msg.editable) {
                                    updatedMessage = await msg.edit(mdat);
                                    // await msg.delete();
                                } else {
                                    updatedMessage = await outputChannel.send(mdat);
                                }
                            } catch (error) {
                                console.error(error);
                                updatedMessage = await outputChannel.send(mdat);
                            }
                        } else {
                            updatedMessage = await outputChannel.send(mdat);
                        } */
                    } else {
                        conf.outputChannel = "";
                    }
                }
            }

            fs.writeFileSync("./conf.json", JSON.stringify(conf, null, 2));
            working = false;
        } catch (error) {
            xlg.error(error);
        }
    }
}