import { GuildMember, User } from "discord.js";

export const permLevels = {
    member: 0,
    immune: 1,
    admin: 2,
    botMaster: 3,
}

export async function getPermLevel(member: GuildMember | User, relative = false): Promise<number> {// The relative option determines if the perm level returned will be actual or relative
    if (member == null || !(member instanceof GuildMember)) {
        return permLevels.member;
    }
    if (!relative) {
        const botmasters = process.env.BOTMASTERS;
        if (botmasters) {
            const bms = botmasters.split(',');
            if (bms.includes(member.user.id)) {
                return permLevels.botMaster;
            }
        }
    }
    if (!member.guild) {
        return permLevels.member;
    }
    if (member.hasPermission('ADMINISTRATOR')) { // if a user has admin rights he's automatically a admin
        return permLevels.admin;
    }
    return permLevels.member;
}
