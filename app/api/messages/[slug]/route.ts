import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import client from "@/lib/db";
import { handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const isString = (value: unknown): value is string => typeof value === "string";

// Export the Message interface
export interface Message {
	id: number;
	text: string;
	date: string;
	url: string;
	authors: Array<{ id: number; name: string }>;
}

interface RouteContext {
	params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
	// Extract slug from Next.js route params (proper method for App Router)
	const { slug } = await context.params;

	try {
		// Apply rate limiting for public read endpoint
		const rateLimitResponse = await applyRateLimit(RATE_LIMITS.PUBLIC_READ);
		if (rateLimitResponse) return rateLimitResponse;

		logger.info("API Route: Processing request", { url: request.url, slug });

		if (!slug) {
			logger.warn("API Route: Invalid slug (empty)", { url: request.url });
			return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
		}

		// First get the current message's ID
		const currentMessage = await client.execute({
			sql: `SELECT id FROM messages WHERE slug = ?`,
			args: [slug],
		});

		if (!currentMessage.rows.length) {
			logger.warn("API Route: Message not found", { slug });
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		const currentId = currentMessage.rows[0].id;

		const navigationResult = await client.execute({
			sql: `
        SELECT
          (SELECT slug FROM messages WHERE id < ? ORDER BY id DESC LIMIT 1) as prevSlug,
          (SELECT slug FROM messages WHERE id > ? ORDER BY id ASC LIMIT 1) as nextSlug
      `,
			args: [currentId, currentId],
		});

		const navigation = {
			prevSlug: navigationResult.rows[0].prevSlug,
			nextSlug: navigationResult.rows[0].nextSlug,
		};

		// Get the message details
		const result = await client.execute({
			sql: `
        SELECT
          m.id,
          m.msg as text,
          m.slug as url,
          m.date,
          CASE
            WHEN COUNT(a.id) = 0 THEN '[]'
            ELSE CONCAT('[',
                GROUP_CONCAT(
                  CASE
                    WHEN a.id IS NOT NULL THEN
                      json_object('id', a.id, 'name', a.name)
                    ELSE NULL
                  END
                )
              ,']')
            END as authors
        FROM messages m
        LEFT JOIN message_authors ma ON m.id = ma.messageId
        LEFT JOIN authors a ON ma.authorId = a.id
        WHERE m.slug = ?
        GROUP BY m.id, m.msg, m.slug, m.date
      `,
			args: [slug],
		});

		if (!result.rows.length) {
			logger.warn("API Route: Full message details not found", { slug });
			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		const row = result.rows[0];
		const authors = isString(row.authors)
			? JSON.parse(row.authors as string)
			: [];

		const message = {
			id: row.id as number,
			text: row.text as string,
			date: row.date as string,
			url: row.url as string,
			authors,
			navigation,
		};

		return NextResponse.json(message);
	} catch (error) {
		logger.error("API Route: Error processing request", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			url: request.url,
			slug: slug,
		});
		return handleAPIError(error, `GET /api/messages/[slug] (slug: ${slug})`);
	}
}
