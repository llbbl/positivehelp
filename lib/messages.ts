import type { Row } from "@libsql/client";
import client from "@/lib/db";
import logger from "@/lib/logger";

export interface Message {
	id: number;
	text: string;
	date: string;
	url: string;
	author?: string;
}

/**
 * Fetches messages from the database
 * @param lastId Optional ID to fetch messages after
 * @returns Array of messages
 */
export async function getMessages(lastId?: number): Promise<Message[]> {
	try {
		// Build the SQL query using parameterized queries
		let sql = `
        SELECT id, msg as text, slug as url, date
        FROM messages
    `;

		const params: any[] = [];

		if (lastId !== undefined && lastId > 0) {
			sql += ` WHERE id > ? `;
			params.push(lastId);
		}

		sql += ` ORDER BY id DESC `;

		const result = await client.execute({
			sql,
			args: params,
		});

		const messages = result.rows.map((row: Row) => ({
			id: row.id as number,
			text: row.text as string,
			date: row.date as string,
			url: row.url as string,
		}));

		return messages;
	} catch (error) {
		logger.error("Error fetching messages:", error);
		return [];
	}
}
