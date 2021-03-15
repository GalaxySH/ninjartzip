import { Client, Collection, Message } from "discord.js";
import * as Specials from "./utils/specials";

export interface XClient extends Client {
    commands?: Collection<string, Command>;
    specials?: typeof Specials;
    services?: MessageServices;
}

export interface Command {
    name: string;
    description?: string;
    args?: boolean;
    usage?: string;
    examples?: string[];
    guildOnly?: boolean;
    permLevel?: number;
    permissions?: PermissionString[];
    hideInHelp?: boolean;
    execute(client: XClient, message: Message, args: string[]): Promise<void | boolean>;
}

export interface MessageService {
    name?: string;
    disabled?: true;
    text?: true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(client: XClient, data: any): Promise<void>;
}
