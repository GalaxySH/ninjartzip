'use strict';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();require('source-map-support').install();

import xlg from "./xlogger";
import Discord, { PermissionString, TextChannel } from 'discord.js';
import { XClient } from "./m";
import { getPermLevel, permLevels } from "./utils/permissions";
import { Commands } from './commands';
import { MessageServices } from "./services";
import * as specials from './utils/specials';

process.on('uncaughtException', function (e) {
    xlg.log(e);
    process.exit(1);
});
process.on('unhandledRejection', async (reason, promise) => {
    const error = new Error('Unhandled Rejection. Reason: ' + reason);
    console.error(error, "Promise:", promise);
});

const client: XClient = new Discord.Client({ partials: ["MESSAGE"] });
client.specials = specials;

client.on("ready", async () => {// This event will run if the bot starts, and logs in, successfully.
    const co = new Commands();
    await co.load(co.rootCommandPath);
    client.commands = co.commands;

    client.services = new MessageServices();
    await client.services.load();

    xlg.log(`Bot ${client.user?.tag}(${client.user?.id}) has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    const lo = client.channels.cache.get('661614128204480522');
    if (lo instanceof TextChannel) {
        lo.send(`Started \\🟩 \\🟩`).catch(console.error);
    }
    /*setInterval(() => {
        const lo = client.channels.cache.get('661614128204480522');
        if (lo instanceof TextChannel) {
            lo.send(`Scheduled Update: ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`).catch(xlg.error);
        }
    }, 3600000);*/

    setInterval(async () => {
        client.user?.setPresence({
            activity: {
                name: `for new art | ${process.env.PREFIX}`,
                type: 'WATCHING'
            },
            status: 'idle'
        }).catch(console.error);
    }, 20000); // Runs this every 20 seconds. Discord has an update LIMIT OF 15 SECONDS

    try {
        //Generates invite link to put in console.
        const link = await client.generateInvite({ permissions: ["ADMINISTRATOR"] });
        console.log(link);

        // Twitch, I hope
        /*await xtwitch.startTwitchListening();
        await xtwitch.addTwitchWebhook();*/
    } catch (e) {
        xlg.error(e);
    }

    xlg.log("Bot initialized")
});

client.on("rateLimit", rateLimitInfo => {
    xlg.log('Ratelimited: ' + JSON.stringify(rateLimitInfo));
});

client.on("guildCreate", guild => {// This event triggers when the bot joins a guild.
    xlg.log(`New guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    const lo = client.channels.cache.get('661614128204480522');
    if (lo instanceof TextChannel) {
        lo.send(`New guild: ${guild.name} (id: ${guild.id}) (members: ${guild.memberCount})`).catch(console.error);
    }
});

client.on("guildDelete", async guild => {// this event triggers when the bot is removed from a guild.
    xlg.log(`Removed from: ${guild.name} (id: ${guild.id})`);
    const lo = client.channels.cache.get('661614128204480522');
    if (lo instanceof TextChannel) {
        lo.send(`Removed from: ${guild.name} (id: ${guild.id})`).catch(console.error);
    }
});

// the actual command processing
client.on("message", async (message) => {// This event will run on every single message received, from any channel or DM.
    try {
        client.services?.runAll(client, message);// run all passive command services

        if (message.author.bot || message.system) return;
        if (!client.user || !client.commands || !process.env.PREFIX) return;

        let dm = false; // checks if it's from a dm
        if (!message.guild)
            dm = true;

        if (message.mentions && message.mentions.has(client.user)) {
            if (message.content == '<@' + client.user.id + '>' || message.content == '<@!' + client.user.id + '>') {
                const iec_gs = 279673;
                message.channel.send({
                    embed: {
                        "description": `${message.guild?.me?.nickname || client.user.username}'s prefix for **${message.guild?.name}** is **${process.env.PREFIX}**`,
                        "color": iec_gs
                    }
                })
                return;
            }
        }

        // Also good practice to ignore any message that does not start with our prefix,
        // which is set in the configuration file.
        if (message.content.toLowerCase().indexOf(process.env.PREFIX) !== 0) return;
        // ▼▼▼▼▼ deprecated with the guild only command handler filter
        //if (message.channel.type === "dm") return;

        const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
        const commandName = args.shift()?.toLowerCase() || "";

        let permLevel = permLevels.member;
        const bmr = process.env.BOTMASTERS;
        let botmasters: string[];
        if (bmr) {
            botmasters = bmr.split(',');
        } else {
            botmasters = [];
        }
        if (!dm) { // gets perm level of member if message isn't from dms
            permLevel = await getPermLevel(message.member || message.author);
        } else if (botmasters.includes(message.author.id)) { // bot masters
            permLevel = permLevels.botMaster;
        }

        const command = client.commands.get(commandName || "");

        if (!command || !command.name) return; //Stops processing if command doesn't exist, this isn't earlier because there are exceptions

        if (command.guildOnly && dm) {// command is configured to only execute outside of dms
            message.channel.send(`That is not a DM executable command.`);
            return;
        }
        if (command.permLevel && permLevel < command.permLevel) {// insufficient bot permissions
            message.channel.send("You lack the permissions required to use this command.")
            return;
        }

        if (command.args && !args.length) {// if arguments are required but not provided, SHOULD ADD SPECIFIC ARGUMENT COUNT PROPERTY
            const fec_gs = 16711680;

            let reply = `Arguments are needed to make that work!`;
            if (command.usage) {
                reply += `\n**Usage:**\n\`${process.env.PREFIX}${command.name} ${command.usage}\``;
            }
            if (command.examples && command.examples.length) {
                reply += `\n**Example${command.examples.length > 1 ? "s" : ""}:**`;
                for (const example of command.examples) {
                    reply += `\n\`${example}\``;
                }
            }

            return message.channel.send({
                embed: {
                    description: reply,
                    color: fec_gs,
                    footer: {
                        text: ['tip: separate arguments with spaces', 'tip: [] means optional, <> means required\nreplace these with your arguments'][Math.floor(Math.random() * 2)]
                    }
                }
            });
        }

        if (command.permissions && command.permissions.length) {
            const lacking: PermissionString[] = [];
            for (const perm of command.permissions) {
                if (!message.guild?.me?.hasPermission(perm)) {
                    lacking.push(perm);
                }
            }
            if (lacking.length) {
                if (message.guild?.me?.permissionsIn(message.channel).has("SEND_MESSAGES")) {
                    await message.channel.send(`I don't have the permissions needed to execute this command. I am missing: ${lacking.map(x => `**${x.toLowerCase().replace(/_/g, " ")}**`).join(", ")}.`);
                }
                return;
            }
        }

        try {
            command.execute(client, message, args);

            const logChannel = client.channels.cache.get('661614128204480522');
            if (logChannel && logChannel instanceof TextChannel) {
                logChannel.send(`${message.author.tag} sent command \`${command.name}\` at \`${message.id}\` ${message.url}`).catch(console.error);
            }
        } catch (error) {
            xlg.error(error);
            message.channel.send("Error while processing")
        }
    } catch (err) {
        message.channel.send("Error while processing")
    }
});

client.on('error', xlg.error);

client.login(process.env.DISCORD_TOKEN);

