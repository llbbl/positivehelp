import { createClient } from '@libsql/client';

const databaseUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or TURSO_DATABASE_URL environment variable is required');
}

if (!authToken) {
  throw new Error('DATABASE_AUTH_TOKEN or TURSO_AUTH_TOKEN environment variable is required');
}

const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

export default client;

export interface Message {
  id: number;
  text: string;
  date: string;
}
