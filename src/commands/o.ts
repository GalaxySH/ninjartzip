import xlg from "../xlogger";
import { Command } from "../m";
import { permLevels } from "../utils/permissions";
import fs from 'fs';
import { stringToChannel } from "../utils/parsers";

export const command: Command = {
    name: "o",
    description: "Set the output channel",
    usage: "<channel>",
    args: true,
    permLevel: permLevels.admin,
    guildOnly: true,
    async execute(client, message, args) {
        try {
            if (!message.guild) return;
            const conf = JSON.parse(fs.readFileSync("./conf.json", 'utf-8'));
            //const conf = await import("../../conf.json");

            const a = args[0];
            const chan = stringToChannel(message.guild, a);
            if (!chan) {
                client.specials?.sendError(message.channel, "Couldn't find that channel");
                return;
            }
            conf.outputChannel = chan.id;
            client.specials?.sendInfo(message.channel, `Output channel set to ${chan}`);

            fs.writeFileSync("./conf.json", JSON.stringify(conf, null, 2));
        } catch (error) {
            xlg.error(error);
            await client.specials?.sendError(message.channel);
            return false;
        }
    }
}
