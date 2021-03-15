import xlg from "../xlogger";
import { Channel, DMChannel, Guild, TextChannel } from 'discord.js';
import { XClient } from "../m";
//import moment from 'moment';

export async function sendError(channel: Channel, message?: string, errorTitle = false): Promise<void> {
    try {
        if (!(channel instanceof TextChannel) && !(channel instanceof DMChannel)) return;
        channel.send({
            embed: {
                color: 16711680,
                title: (errorTitle) ? "Error" : undefined,
                description: (message && message.length) ? message : "Something went wrong. ¯\\_(ツ)_/¯"
            }
        });
        return;
    } catch (error) {
        xlg.error(error);
    }
}

export async function sendInfo(channel: Channel, message: string): Promise<void> {
    try {
        if (!(channel instanceof TextChannel) && !(channel instanceof DMChannel)) return;
        channel.send({
            embed: {
                color: process.env.INFO_COLOR,
                description: `<:sminfo:818342088088354866> ${message}`
            }
        });
        return;
    } catch (error) {
        xlg.error(error);
    }
}

// export async function argsNumRequire(channel: Channel, args: string[], num: number): Promise<boolean> {
//     try {
//         if (!(channel instanceof TextChannel) && !(channel instanceof DMChannel)) return false;
//         if (args.length == num) return true;
//         const fail_embed_color = await Bot.client.database?.getColor("fail_embed_color");
//         channel.send({
//             embed: {
//                 color: fail_embed_color,
//                 description: `The wrong number of arguments was provided.\nThis command requires \` ${num} \` arguments.`
//             }
//         });
//         return false;
//     } catch (error) {
//         xlg.error(error);
//         return false;
//     }
// }

// export async function argsMustBeNum(channel: Channel, args: string[]): Promise<boolean> {
//     try {
//         if (!(channel instanceof TextChannel) && !(channel instanceof DMChannel)) return false;
//         if (!args || !args.length) return false;
//         let forResult = true;
//         for (let i = 0; i < args.length; i++) {
//             const arg = args[i];
//             const nr = parseInt(arg, 10);
//             if (isNaN(nr)) {
//                 forResult = false;
//             }
//         }
//         if (!forResult) {
//             channel.send({
//                 embed: {
//                     color: await Bot.client.database?.getColor("fail_embed_color"),
//                     title: "invalid arguments",
//                     description: "all arguments must be numbers (floating or integer)"
//                 }
//             }).catch(xlg.error);
//             return false;
//         }
//         return true;
//     } catch (error) {
//         xlg.error(error);
//         return false;
//     }
// }

export function memoryUsage(): string {
    const memTypes = {
        "rss": "RSS ---------------",
        "heapTotal": "HeapTotal ---------",
        "heapUsed": "HeapUsed ----------",
        "external": "External ----------",
        "arrayBuffers": "ArrayBuffers ------"
    };
    return Object.entries(process.memoryUsage()).map(usage => {
        const u = usage[0];
        if (u !== "rss" && u !== "heapTotal" && u !== "heapUsed" && u !== "external" && u !== "arrayBuffers") return;
        const r = (Math.round(usage[1] / 1024 / 1024 * 100) / 100).toFixed().split('.')[0];
        return `${memTypes[u]} ${r}MB`
    }).join("\n");
}

// iannis
/*export function delayedLoop(callback: (arg0: number) => void, start = 0, end = 1, increment = 1, delay = 0): void {
    let i = start;

    const iteration = () => {
        callback(i);
        i += increment;
        if (i < end) setTimeout(iteration, delay);
    }

    iteration();
}*/

export async function getAllGuilds(client: XClient): Promise<Guild[] | false> {
    const reductionFunc = (p: Guild[], c: Guild[]) => {
        for (const bg of c) {
            p.push(bg);
        }
        return p;
    };
    const guilds = (await client.shard?.fetchClientValues("guilds.cache"))?.reduce(reductionFunc, <Guild[]>[]);
    if (!guilds) {
        return false;
    }
    return guilds;
}

export async function getAllChannels(client: XClient): Promise<Channel[] | false> {
    const reductionFunc = (p: Channel[], c: Channel[]) => {
        for (const chan of c) {
            p.push(chan);
        }
        return p;
    };
    const channels = (await client.shard?.fetchClientValues("channels.cache"))?.reduce(reductionFunc, []);
    if (!channels) {
        return false;
    }
    return channels;
}

export function titleCase(str: string): string {
    const splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
}

