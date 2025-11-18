import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// During build time, use dummy values - they won't actually be used
// Real values will be required at runtime
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const databaseUrl = process.env.TURSO_DATABASE_URL || (isBuildTime ? 'libsql://build-time-dummy.turso.io' : '');
const authToken = process.env.TURSO_AUTH_TOKEN || (isBuildTime ? 'build-time-dummy-token' : '');

if (!databaseUrl && !isBuildTime) {
	throw new Error("TURSO_DATABASE_URL environment variable is required");
}

if (!authToken && !isBuildTime) {
	throw new Error("TURSO_AUTH_TOKEN environment variable is required");
}

const client = createClient({
	url: databaseUrl,
	authToken: authToken,
});

export const db = drizzle(client);
