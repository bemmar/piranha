import { Pool } from 'mysql2/promise';
import { createPool } from 'mysql2';

let cachedPool: Pool | null = null;

export default async function (): Promise<Pool> {
    if (cachedPool) {
        return cachedPool;
    }

    const pool = await createPool({
        host: process.env.DB_CONNECTION!,
        port: parseInt(process.env.DB_PORT!),
        database: process.env.DB_DATABASE!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        multipleStatements: true
    }).promise();

    cachedPool = pool;
    return pool;
}