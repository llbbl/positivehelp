import { createClient } from "@libsql/client";
import { env } from "@/lib/env";

const client = createClient({
	url: env.TURSO_DATABASE_URL,
	authToken: env.TURSO_AUTH_TOKEN,
});

export default client;

export interface Message {
	id: number;
	text: string;
	date: string;
}
