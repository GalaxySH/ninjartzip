import { Command } from "../m";
import xlg from '../xlogger';

export const command: Command = {
    name: 'help',
    description: 'Get the command list',
    async execute(client, message) {
        try {
            if (!client.commands) return;
            let hc = 0;
            const cmdMap: string[] = [];
            client.commands.forEach(c => {
                if (!c.hideInHelp) {
                    cmdMap.push(`🔹 \`${process.env.PREFIX}${c.name} ${c.usage || ""}\`\n${c.description}`)
                } else {
                    hc++;
                }
            });
            await message.channel.send({
                embed: {
                    color: process.env.INFO_COLOR,
                    title: "Commands",
                    description: `Use this command any time.
<:join:795140993368195092> [Join the support server.](https://dsc.gg/ro)

**Commands:**
(${hc} hidden)
${cmdMap.join("\n")}`,
                    footer: {
                        text: `This bot is meant to be used passively`
                    }
                }
            });
        } catch (error) {
            xlg.error(error);
            await client.specials?.sendError(message.channel);
            return false;
        }
    }
}

