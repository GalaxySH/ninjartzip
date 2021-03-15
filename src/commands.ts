import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "./m";

export class Commands {
    public commands: Collection<string, Command>;
    public rootCommandPath: string;
    private commandNumber: number;

    constructor() {
        this.commands = new Collection();
        this.rootCommandPath = path.join(__dirname, './commands/');
        this.commandNumber = 1;
        //this.load(this.rootCommandPath);
    }

    // ▼▲▼▲▼▲▼▲▼▲▼▲▼▲ for command handler, got this from https://discordjs.guide/command-handling/

    async load(dir: string): Promise<void> {
        const cf = fs.readdirSync(dir).filter(file => !file.startsWith('[template]'));

        const folders = cf.filter(x => fs.lstatSync(dir + x).isDirectory());
        for (const folder of folders) {
            this.load(dir + folder + "/");
        }

        const cmds = cf.filter(file => file.endsWith('.js'));
        if (cmds.length < 1) {
            console.log(`\x1b[33mWARNING: \x1b[32mno command files in ${dir}\x1b[0m`)
            return;
        }

        for (const cmdfile of cmds) {
            const { command } = await import(`${dir}${cmdfile}`);

            // set a new item in the Collection
            // with the key as the command name and the value as the exported module
            this.commands.set(command.name, command);

            let noName = '';
            if (command.name == "" || command.name == null) {
                noName = ' \x1b[33mWARNING: \x1b[32mthis command has no name, it may not be configured properly\x1b[0m';
            }
            if (!command.execute) {
                noName = ' \x1b[33mWARNING: \x1b[32mthis command has no function, it may not be configured properly\x1b[0m';
            }
            console.log(`$ ${this.commandNumber} - %s$${command.name}%s has been loaded%s`, "\x1b[35m", "\x1b[0m", noName);

            this.commandNumber++;
        }
    }
}
