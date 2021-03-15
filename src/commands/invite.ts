import { Command } from "../m";
import { permLevels } from "../utils/permissions";

export const command: Command = {
    name: 'invite',
    description: "Get the bot's invite link",
    usage: "[server id]",
    hideInHelp: true,
    permLevel: permLevels.botMaster,
    async execute(client, message, args) {
        let guildIdParam = "";
        if (args.length && args.length == 1 && !isNaN(parseInt(args[0])) && args[0].toString().length == 18) {
            guildIdParam = `&guild_id=${args[0]}`;
        }
        message.channel.send({
            embed: {
                color: process.env.INFO_COLOR,
                description: `[Link](https://discordapp.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=${process.env.PERMS}&scope=bot&${guildIdParam})`,
                footer: {
                    icon_url: client.user?.avatarURL() || undefined,
                    text: "Invite"
                }
            }
        });

    }
}

