import xlg from "../xlogger";
import { MessageService } from "../m";

export const service: MessageService = {
    text: undefined,
    async execute(client, data) {
        try {
            //
        } catch (error) {
            xlg.error(error);
        }
    }
}