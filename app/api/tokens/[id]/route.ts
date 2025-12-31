import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { apiTokens } from "@/db/schema";
import { APIError, handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * DELETE /api/tokens/[id]
 * Soft delete (revoke) an API token by setting revokedAt timestamp
 */
export async function DELETE(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		// Apply rate limiting for sensitive token operations
		const rateLimitResponse = await applyRateLimit(RATE_LIMITS.SENSITIVE);
		if (rateLimitResponse) return rateLimitResponse;

		const params = await context.params;
		const tokenId = parseInt(params.id, 10);

		if (isNaN(tokenId) || tokenId <= 0) {
			throw new APIError("Invalid token ID", 400, "INVALID_TOKEN_ID");
		}

		const user = await currentUser();

		if (!user) {
			logger.info("Unauthorized access attempt to delete token");
			throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
		}

		// Verify token exists and belongs to user (and is not already revoked)
		const existingToken = await db
			.select({ id: apiTokens.id })
			.from(apiTokens)
			.where(
				sql`${apiTokens.id} = ${tokenId} AND ${apiTokens.clerkUserId} = ${user.id} AND ${apiTokens.revokedAt} IS NULL`,
			);

		if (!existingToken || existingToken.length === 0) {
			logger.warn("Token not found or not owned by user", {
				tokenId,
				userId: user.id,
			});
			throw new APIError("Token not found", 404, "TOKEN_NOT_FOUND");
		}

		// Soft delete by setting revokedAt timestamp
		const revokedAt = new Date().toISOString();

		await db
			.update(apiTokens)
			.set({ revokedAt })
			.where(eq(apiTokens.id, tokenId));

		logger.info("Token revoked successfully", {
			tokenId,
			userId: user.id,
			revokedAt,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error("Error revoking token", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return handleAPIError(error, "DELETE /api/tokens/[id]");
	}
}
