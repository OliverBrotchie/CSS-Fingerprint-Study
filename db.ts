import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";

const env = config();

/**
 * The authentication object to connect to the postgreSQL database.
 */
const client = new Client({
    user: env.user,
    password: env.password,
    database: env.database,
    hostname: env.hostname,
    port: env.port,
});

/**
 * Run a query on the postgreSQL database.
 *
 * @param q the postgreSQL query string
 */
export async function query(q: string) {
    let result;
    await client.connect();
    try {
        result = await client.queryObject(q);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
    return result;
}
