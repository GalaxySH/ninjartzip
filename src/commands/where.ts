import xlg from "../xlogger";
import { Command } from "../m";
import { permLevels } from "../utils/permissions";

export const command: Command = {
    name: "where",
    description: "Get the location of the latest archive dump",
    usage: "",
    args: false,
    permLevel: permLevels.member,
    guildOnly: false,
    async execute(client, message) {
        try {
            const conf = await import("../../conf.json");
            if (!conf.oMessageLink) {
                await client.specials?.sendError(message.channel, "There doesn't seem to be an updated location available");
                return;
            }
            await message.channel.send(conf.oMessageLink);
        } catch (error) {
            xlg.error(error);
            await client.specials?.sendError(message.channel);
            return false;
        }
    }
}
