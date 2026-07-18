import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { submissions } from "@/db/schema";
import { isUserAdmin } from "@/lib/auth";
import { getRejectionResult, SUBMISSION_STATUS } from "@/lib/constants";
import { APIError, handleAPIError } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { adminSchemas, validateParams } from "@/lib/validation/types";

export async function POST(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		// Apply rate limiting for admin endpoint
		const rateLimitResponse = await applyRateLimit(RATE_LIMITS.ADMIN);
		if (rateLimitResponse) return rateLimitResponse;

		// Validate URL parameters
		const params = await context.params;
		const { id: submissionId } = await validateParams(
			adminSchemas.submissionId,
		)(params);

		const user = await currentUser();

		if (!user) {
			logger.info("Unauthorized access attempt to reject submission");
			throw new APIError("Authentication required", 401, "AUTH_REQUIRED");
		}

		const isAdmin = await isUserAdmin(user);

		if (!isAdmin) {
			logger.info("Non-admin attempt to reject submission", {
				userId: user.id,
			});
			throw new APIError("Admin access required", 403, "ADMIN_REQUIRED");
		}

		// Atomically transition only pending submissions. Matching the prior status
		// prevents a concurrent approval from being overwritten after publishing.
		const [rejectedSubmission] = await db
			.update(submissions)
			.set({ status: SUBMISSION_STATUS.DENIED })
			.where(
				and(
					eq(submissions.id, submissionId),
					eq(submissions.status, SUBMISSION_STATUS.PENDING),
				),
			)
			.returning({ id: submissions.id });

		let currentStatus: number | undefined;
		if (!rejectedSubmission) {
			const [submission] = await db
				.select({ status: submissions.status })
				.from(submissions)
				.where(eq(submissions.id, submissionId));
			currentStatus = submission?.status;
		}

		const result = getRejectionResult(
			Boolean(rejectedSubmission),
			currentStatus,
		);

		if (result === "not-found") {
			logger.warn("Submission not found for rejection", { submissionId });
			throw new APIError("Submission not found", 404, "NOT_FOUND");
		}

		if (result === "already-rejected") {
			logger.info(
				"Submission already rejected; treating request as idempotent",
				{
					submissionId,
				},
			);
			return new NextResponse("Rejected", { status: 200 });
		}

		if (result === "conflict") {
			logger.warn("Attempt to reject submission from invalid status", {
				submissionId,
				status: currentStatus,
			});
			const isApproved = currentStatus === SUBMISSION_STATUS.APPROVED;
			throw new APIError(
				isApproved
					? "Submission already approved"
					: "Submission cannot be rejected from its current status",
				409,
				isApproved ? "ALREADY_APPROVED" : "INVALID_STATUS_TRANSITION",
			);
		}

		logger.info("Submission rejected successfully", {
			submissionId,
			rejectedBy: user.id,
		});

		return new NextResponse("Rejected", { status: 200 });
	} catch (error) {
		logger.error("Error rejecting submission", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return handleAPIError(error, "POST /api/admin/submissions/[id]/reject");
	}
}
