declare module "*.json";

declare namespace NodeJS {
    interface ProcessEnv {
        DISCORD_TOKEN?: string;
        PREFIX?: string;
        NODE_ENV?: string;
        BOTMASTERS?: string;
        ZIP_CHAN?: string;
        ZIP_REACHBACK?: string;
        PERMS?: string;
        INFO_COLOR?: string;
    }
}