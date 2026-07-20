import type { InValue, Row } from "@libsql/client";
import { MESSAGE_MAX_PAGE_SIZE, MESSAGE_PAGE_SIZE } from "@/lib/constants";
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
 * @param limit Maximum number of messages to return
 * @returns Array of messages
 */
export async function getMessages(
	lastId?: number,
	limit = MESSAGE_PAGE_SIZE,
): Promise<Message[]> {
	try {
		const boundedLimit = Math.min(
			Math.max(Math.trunc(limit), 1),
			MESSAGE_MAX_PAGE_SIZE,
		);
		const isIncremental = lastId !== undefined && lastId > 0;

		// Build the SQL query using parameterized queries
		let sql = `
        SELECT id, msg as text, slug as url, date
        FROM messages
    `;

		const params: InValue[] = [];

		if (isIncremental) {
			sql += ` WHERE id > ? `;
			params.push(lastId);
		}

		// Incremental queries select the oldest unseen IDs first so advancing the
		// cursor cannot skip messages when more than one page arrives between polls.
		sql += ` ORDER BY id ${isIncremental ? "ASC" : "DESC"} LIMIT ? `;
		params.push(boundedLimit);

		const result = await client.execute({
			sql,
			args: params,
		});

		const fetchedMessages = result.rows.map((row: Row) => ({
			id: row.id as number,
			text: row.text as string,
			date: row.date as string,
			url: row.url as string,
		}));

		// The public response contract remains newest-first for all query modes.
		return isIncremental ? fetchedMessages.reverse() : fetchedMessages;
	} catch (error) {
		// Log then re-throw. Swallowing the error into an empty array would
		// let a transient DB failure surface as a cacheable empty 200 response
		// (see app/api/messages/route.ts caching), poisoning the edge cache
		// with an empty homepage for the full max-age window. Re-throwing lets
		// the API route's handleAPIError return an uncacheable 5xx, and the
		// homepage server component fall through to app/error.tsx.
		logger.error("Error fetching messages:", error);
		throw error;
	}
}
