import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";

/**
 * Single raw libSQL client instance
 * Use this for raw SQL queries when Drizzle ORM is not suitable
 */
export const rawClient: Client = createClient({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_AUTH_TOKEN,
});

/**
 * Drizzle ORM instance wrapping the raw client
 * Use this for type-safe ORM queries
 */
export const db = drizzle(rawClient);
