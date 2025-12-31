import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { authors, message_authors, messages, submissions } from "@/db/schema";
import { isUserAdmin } from "@/lib/auth";
import { SUBMISSION_STATUS } from "@/lib/constants";
import { APIError, handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { adminSchemas, validateParams } from "@/lib/validation/types";

export async function POST(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	try {
		// Apply rate limiting for admin endpoint
		const rateLimitResponse = await applyRateLimit(RATE_LIMITS.ADMIN);
		if (rateLimitResponse) return rateLimitResponse;

		// Validate URL parameters
		const params = await context.params;
		const { id: submissionId } = await validateParams(
			adminSchemas.submissionId,
		)(params);

		logger.info("Processing approval request", {
			submissionId,
		});

		const user = await currentUser();

		if (!user) {
			logger.info("Unauthorized access attempt to approve submission");
			throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
		}

		const isAdmin = await isUserAdmin(user);

		if (!isAdmin) {
			logger.info("Non-admin attempt to approve submission", {
				userId: user.id,
			});
			throw new APIError("Admin access required", 403, "ADMIN_REQUIRED");
		}

		// Get the submission
		const [submission] = await db
			.select()
			.from(submissions)
			.where(eq(submissions.id, submissionId));

		if (!submission) {
			logger.warn("Submission not found for approval", { submissionId });
			throw new APIError("Submission not found", 404, "NOT_FOUND");
		}

		if (submission.status === SUBMISSION_STATUS.APPROVED) {
			logger.warn("Attempt to approve already approved submission", {
				submissionId,
			});
			throw new APIError(
				"Submission already approved",
				400,
				"ALREADY_APPROVED",
			);
		}

		// Start a transaction
		await db.transaction(async (tx) => {
			// Insert into messages
			const [insertedMessage] = await tx
				.insert(messages)
				.values({
					msg: submission.msg,
					hash: submission.hash,
					slug: submission.slug,
					date: submission.date,
					clerkUserId: submission.clerkUserId,
					approvalClerkUserId: user.id,
					approvalDate: new Date().toISOString(),
				})
				.returning();

			if (!insertedMessage?.id) {
				throw new Error("Failed to get inserted message ID");
			}

			// Handle author mapping if there's an author name
			if (submission.authorName) {
				// Find or create author
				let [existingAuthor] = await tx
					.select()
					.from(authors)
					.where(eq(authors.name, submission.authorName));

				if (!existingAuthor) {
					[existingAuthor] = await tx
						.insert(authors)
						.values({ name: submission.authorName })
						.returning();
				}

				if (existingAuthor?.id) {
					// Create message-author association
					await tx.insert(message_authors).values({
						messageId: insertedMessage.id,
						authorId: existingAuthor.id,
					});
				}
			}

			// Update submission status
			await tx
				.update(submissions)
				.set({ status: SUBMISSION_STATUS.APPROVED })
				.where(eq(submissions.id, submissionId));
		});

		logger.info("Submission approved successfully", {
			submissionId,
			approvedBy: user.id,
		});

		return new NextResponse("Approved", { status: 200 });
	} catch (error) {
		logger.error("Error approving submission", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return handleAPIError(error, "POST /api/admin/submissions/[id]/approve");
	}
}
