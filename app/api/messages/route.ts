import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/auth";
import { getOrCreateAuthor } from "@/lib/authors";
import client from "@/lib/db";
import { CACHE_MAX_AGE_SECONDS } from "@/lib/constants";
import { APIError, handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { getMessages } from "@/lib/messages";
import {
	messageSchemas,
	validateBody,
	validateQuery,
} from "@/lib/validation/types";
import { generateMD5, generateSlug } from "@/utils/text";

// This is the API route handler for client-side requests
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);

		// Validate query parameters using Zod
		const validatedQuery = await validateQuery(messageSchemas.query)(
			url.searchParams,
		);

		// Extract validated parameters
		const { lastId, t } = validatedQuery;
		const bypassCache = t !== undefined;

		const messages = await getMessages(lastId);

		// Set appropriate cache control headers based on the request
		const headers = new Headers();

		if (bypassCache || lastId !== undefined) {
			// For requests with timestamp parameter or lastId, disable caching
			headers.set(
				"Cache-Control",
				"no-store, no-cache, must-revalidate, proxy-revalidate",
			);
			headers.set("Pragma", "no-cache");
			headers.set("Expires", "0");
		} else {
			// For normal requests, allow caching for a short period (5 minutes)
			headers.set(
				"Cache-Control",
				`public, max-age=${CACHE_MAX_AGE_SECONDS}, s-maxage=${CACHE_MAX_AGE_SECONDS}`,
			);
		}

		return NextResponse.json(messages, { headers });
	} catch (error) {
		logger.error("Error fetching messages:", error);
		return handleAPIError(error, "GET /api/messages");
	}
}

export async function POST(request: Request) {
	try {
		// Validate request body using Zod
		const validatedBody = await validateBody(messageSchemas.create)(request);
		const { text, author, clerkUserId } = validatedBody;

		const currentDate = new Date().toISOString().split("T")[0];

		const hash = generateMD5(text);
		const slug = generateSlug(text, hash);

		// Check if message already exists
		const existing = await client.execute({
			sql: "SELECT id, slug FROM messages WHERE hash = ?",
			args: [hash],
		});

		if (existing.rows.length > 0) {
			// --- Message Exists ---
			const existingMessageId = existing.rows[0].id;
			const existingSlug = existing.rows[0].slug;
			if (
				typeof existingMessageId !== "bigint" &&
				typeof existingMessageId !== "number"
			) {
				throw new Error("Invalid message id");
			}

			if (author) {
				const authorId = await getOrCreateAuthor(author);
				if (authorId !== null) {
					const attributionExists = await client.execute({
						sql: "SELECT 1 FROM message_authors WHERE messageId = ? AND authorId = ?",
						args: [existingMessageId, authorId],
					});

					if (attributionExists.rows.length === 0) {
						await client.execute({
							sql: "INSERT INTO message_authors (messageId, authorId) VALUES (?, ?)",
							args: [existingMessageId, authorId],
						});
					}
				}
			}

			return NextResponse.json({ success: true, slug: existingSlug });
		} else {
			// --- Message Doesn't Exist ---
			// Get the auth session
			const session = await auth();
			if (!session || !session.userId) {
				throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
			}

			if (session.userId !== clerkUserId) {
				throw new APIError(
					"User authentication mismatch",
					403,
					"AUTH_MISMATCH",
				);
			}

			// Get the full user object for admin check
			const user = await currentUser();
			if (!user) {
				throw new APIError("Failed to get user details", 401, "USER_NOT_FOUND");
			}

			const isAdmin = await isUserAdmin(user);

			if (isAdmin) {
				// Direct insert into messages for admins
				const messageResult = await client.execute({
					sql: "INSERT INTO messages (msg, date, slug, hash, clerkUserId, approvalClerkUserId, approvalDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
					args: [
						text,
						currentDate,
						slug,
						hash,
						clerkUserId,
						clerkUserId,
						currentDate,
					],
				});

				if (
					typeof messageResult.lastInsertRowid !== "bigint" &&
					typeof messageResult.lastInsertRowid !== "number"
				) {
					throw new Error("Failed to get inserted message ID");
				}
				const messageId = messageResult.lastInsertRowid;

				if (author) {
					const authorId = await getOrCreateAuthor(author);
					if (authorId !== null) {
						await client.execute({
							sql: "INSERT INTO message_authors (messageId, authorId) VALUES (?, ?)",
							args: [messageId, authorId],
						});
					}
				}
			} else {
				// Insert into submissions for non-admins
				const submissionResult = await client.execute({
					sql: "INSERT INTO submissions (msg, date, slug, hash, clerkUserId, authorName) VALUES (?, ?, ?, ?, ?, ?)",
					args: [text, currentDate, slug, hash, clerkUserId, author || null],
				});

				if (
					typeof submissionResult.lastInsertRowid !== "bigint" &&
					typeof submissionResult.lastInsertRowid !== "number"
				) {
					throw new Error("Failed to get inserted submission ID");
				}
			}

			return NextResponse.json({ success: true, slug });
		}
	} catch (error) {
		logger.error("Error creating message:", error);
		return handleAPIError(error, "POST /api/messages");
	}
}
