import { Pool, QueryArguments } from "https://deno.land/x/postgres@v0.19.2/mod.ts";

export class Postgres {
    private pool: Pool;

    constructor(url: string, size = 10) {
        this.pool = new Pool(url, size, true);
    }

    async execute<T>(sql: string, args?: QueryArguments) {
        const client = await this.pool.connect();
        try {
            return await client.queryObject<T>(sql, args);
        } finally {
            client.release();
        }
    }
}