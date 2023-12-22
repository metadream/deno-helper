const textEncoder = new TextEncoder();

export type EventSource = {
    id?: string | number,
    event?: string;
    interval?: number;
    retry?: number;
    data: () => Promise<object>;
}

/**
 * Server-Sent Event Stream
 *
 * @example new EventStream({ data: async () => await this.getJsonData() }).buildResponse()
 * @Author metadream
 * @Since 2023-12-22
 */
export class EventStream extends ReadableStream<Uint8Array> {

    constructor(source: EventSource) {
        const { id, event, retry, data, interval } = source;
        const getSource = async () => {
            let message = "";
            if (id) message += `id: ${id}\n`;
            if (event) message += `event: ${event}\n`;
            if (retry) message += `retry: ${retry}\n`;
            message += `data: ${JSON.stringify(await data())}\n\n`;
            return message;
        }

        let timer = 0;
        super({
            start(controller) {
                timer = setInterval(async () => {
                    controller.enqueue(textEncoder.encode(await getSource()));
                }, interval || 1000);
            },
            cancel() {
                if (timer > 0) clearInterval(timer);
            }
        });
    }

    buildResponse() {
        return new Response(this, {
            headers: {
                "Content-Type": "text/event-stream",
                "Connection": "keep-alive",
                "Cache-Control": "no-cache",
            }
        });
    }

}