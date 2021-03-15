import { Collection, Message } from "discord.js";
import fs from "fs";
import { MessageService, XClient } from "../m";
//import { Mute } from "../utils/modactions";

export class MessageServices {
    private services: Collection<string, MessageService>;
    public automods: string[];

    constructor() {
        this.services = new Collection();
        this.automods = [];
    }

    async load(): Promise<void> {
        const serviceFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && !file.startsWith('[template]') && file !== "index.js")

        for (const file of serviceFiles) {
            const { service } = await import(`${__dirname}/${file}`);
            const name = file.split(".")[0];
            service.name = name;
            this.services.set(name, service);
            console.log(`Loaded service: ${name}`);
            if (file.startsWith("automod_")) {
                this.automods.push(name.split("_")[1]);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    async run(client: XClient, mod: string, data: any): Promise<void> {
        try {
            const serv = this.services.find((s) => s.name === mod);
            if (serv && !serv.disabled) {
                await serv.execute(client, data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Better to consider this runAllTextServices
     */
    async runAll(client: XClient, message: Message): Promise<void> {
        try {
            this.services.forEach(async (service: MessageService) => {
                if (service.text && !service.disabled && !(service.name?.startsWith("automod_") && message.author.id === client.user?.id)) {
                    await service.execute(client, message);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    isText(mod: string): boolean {
        const s = this.services.find(x => x.name === mod);
        if (s && s.text) {
            return true;
        } else {
            return false;
        }
    }
}
