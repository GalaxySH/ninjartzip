import xlg from "../xlogger";
import { MessageService } from "../m";
import { Collection, DMChannel, Message, MessageAttachment, MessageOptions, NewsChannel, TextChannel } from "discord.js";
import fs from 'fs';
import Zip from 'jszip';
import fetch from 'node-fetch';
import moment from 'moment';

let working = false;
const maxfetch = parseInt(process.env.ZIP_REACHBACK || "0") || 1000;
async function getAllMessages(c: TextChannel | NewsChannel, m?: Collection<string, Message>): Promise<Collection<string, Message>> {
    const msgs = await c.messages.fetch({ limit: 100 });
    if (m) {
        msgs.concat(m)
    }
    if (msgs.size > 98 && msgs.size < maxfetch) {
        return await getAllMessages(c, msgs);
    }
    return msgs;
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
            const links: string[] = [];
            messages.forEach(m => {
                if (m.attachments.size) {
                    for (const att of m.attachments.array()) {
                        if (att.height && att.width) {
                            links.push(att.url);
                        }
                    }
                }
            });

            const zip = new Zip();
            zip.file("README.txt", `This is an automatically generated archive file.\n\nThe contents of this file are derived from a channel: #${message.channel.name} (${message.channel.id}).\n\nReport issues regarding this file or something related to ComradeRooskie#6969.`);
            const folder = zip.folder("images");
            if (!folder) {
                working = false;
                return;
            }
            for await (const link of links) {
                const linkParts = link.split("/");
                const name = linkParts[linkParts.length - 1];
                const r = await fetch(link);
                const i = await r.buffer();
                //fs.writeFileSync(`./media/${name}`, i);
                folder.file(name, i);
            }
            //const zipped = new Zip();
            //console.log(zipped);
            const zipped = await zip.generateAsync({ type: "nodebuffer" });
            const outputName = `ninjartist_${moment().format('YYYY-MM-DD_HH-mm-ss')}.zip`;
            const outputPath = `./zips/${outputName}`;
            fs.writeFileSync(outputPath, zipped);

            if (conf.outputChannel) {
                const outputChannel = message.client.channels.cache.get(conf.outputChannel);
                if (outputChannel) {
                    if (outputChannel instanceof TextChannel || outputChannel instanceof NewsChannel) {
                        const attach = new MessageAttachment(outputPath);
                        conf.id += 1;
                        const mdat: MessageOptions = {
                            content: `Gallery v${conf.id}\nGenerated at ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
                            files: [attach],
                        }
                        const updatedMessage = await outputChannel.send(mdat);
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
                        if (conf.outputMessage) {
                            try {
                                const msg = await outputChannel.messages.fetch(conf.outputMessage);
                                if (msg && msg.deletable) {
                                    await msg.delete();
                                }
                            } catch (error) {
                                //
                            }
                        }
                        if (updatedMessage && updatedMessage instanceof Message) {
                            conf.outputMessage = updatedMessage.id;
                            conf.oMessageLink = updatedMessage.url;
                        }
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