import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import { db } from '@/db/client';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import logger from '@/lib/logger';
import { adminSchemas, validateParams } from '@/lib/validation/types';
import { handleAPIError, APIError } from '@/lib/error-handler';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate URL parameters
    const params = await context.params;
    const { id: submissionId } = await validateParams(adminSchemas.submissionId)(params);
    
    const user = await currentUser();
    
    if (!user) {
      logger.info("Unauthorized access attempt to reject submission");
      throw new APIError("Authentication required", 401, 'AUTH_REQUIRED');
    }

    const isAdmin = await isUserAdmin(user);
    
    if (!isAdmin) {
      logger.info("Non-admin attempt to reject submission", { userId: user.id });
      throw new APIError("Admin access required", 403, 'ADMIN_REQUIRED');
    }

    // Check if submission exists and isn't already rejected
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      logger.warn("Submission not found for rejection", { submissionId });
      throw new APIError("Submission not found", 404, 'NOT_FOUND');
    }

    if (submission.status === 0) {
      logger.warn("Attempt to reject already rejected submission", { submissionId });
      throw new APIError("Submission already rejected", 400, 'ALREADY_REJECTED');
    }

    // Update submission status
    const result = await db
      .update(submissions)
      .set({ status: 0 }) // 0 = rejected
      .where(eq(submissions.id, submissionId));

    logger.info("Submission rejected successfully", { 
      submissionId,
      rejectedBy: user.id 
    });

    return new NextResponse("Rejected", { status: 200 });
  } catch (error) {
    logger.error("Error rejecting submission", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return handleAPIError(error, 'POST /api/admin/submissions/[id]/reject');
  }
} 