import { currentUser } from "@clerk/nextjs/server";
import { eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { apiTokens } from "@/db/schema";
import { APIError, handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { generateAPIToken } from "@/lib/tokens";

/**
 * GET /api/tokens
 * List user's API tokens (excluding actual token value for security)
 */
export async function GET() {
	try {
		const user = await currentUser();

		if (!user) {
			logger.info("Unauthorized access attempt to list tokens");
			throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
		}

		const tokens = await db
			.select({
				id: apiTokens.id,
				name: apiTokens.name,
				createdAt: apiTokens.createdAt,
				lastUsedAt: apiTokens.lastUsedAt,
			})
			.from(apiTokens)
			.where(
				sql`${apiTokens.clerkUserId} = ${user.id} AND ${apiTokens.revokedAt} IS NULL`,
			);

		logger.info("Tokens listed successfully", {
			userId: user.id,
			tokenCount: tokens.length,
		});

		return NextResponse.json({ tokens });
	} catch (error) {
		logger.error("Error listing tokens", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return handleAPIError(error, "GET /api/tokens");
	}
}

/**
 * POST /api/tokens
 * Generate a new API token. The token value is returned ONLY in this response.
 */
export async function POST(request: Request) {
	try {
		const user = await currentUser();

		if (!user) {
			logger.info("Unauthorized access attempt to create token");
			throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
		}

		// Parse request body for token name
		let name = "Desktop App";
		try {
			const body = await request.json();
			if (body.name && typeof body.name === "string" && body.name.trim()) {
				name = body.name.trim();
			}
		} catch {
			// If body parsing fails, use default name
		}

		// Generate the token
		const token = generateAPIToken();
		const createdAt = new Date().toISOString();

		// Insert into database
		const result = await db
			.insert(apiTokens)
			.values({
				token,
				clerkUserId: user.id,
				name,
				createdAt,
			})
			.returning({
				id: apiTokens.id,
				name: apiTokens.name,
				createdAt: apiTokens.createdAt,
			});

		if (!result || result.length === 0) {
			throw new APIError("Failed to create token", 500, "TOKEN_CREATE_FAILED");
		}

		logger.info("Token created successfully", {
			userId: user.id,
			tokenId: result[0].id,
			tokenName: name,
		});

		// Return the token value ONLY in this response
		return NextResponse.json({
			token: {
				id: result[0].id,
				name: result[0].name,
				createdAt: result[0].createdAt,
				value: token, // Only returned during creation
			},
		});
	} catch (error) {
		logger.error("Error creating token", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return handleAPIError(error, "POST /api/tokens");
	}
}
