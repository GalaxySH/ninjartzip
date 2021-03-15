import xlg from "../xlogger";
import { Command } from "../m";
import { permLevels } from "../utils/permissions";

export const command: Command = {
    name: "",
    description: "",
    usage: "",
    args: false,
    permLevel: permLevels.member,
    guildOnly: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(client, message, args) {
        try {
            //
        } catch (error) {
            xlg.error(error);
            await client.specials?.sendError(message.channel);
            return false;
        }
    }
}
