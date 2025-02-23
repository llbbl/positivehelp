import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import { db } from '@/db/client';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import logger from '@/lib/logger';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  let id = '';
  
  try {
    ({ id } = await context.params);
    const user = await currentUser();
    
    if (!user) {
      logger.info("Unauthorized access attempt to reject submission");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await isUserAdmin(user);
    
    if (!isAdmin) {
      logger.info("Non-admin attempt to reject submission", { userId: user.id });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const submissionId = parseInt(id);
    if (isNaN(submissionId)) {
      return new NextResponse("Invalid submission ID", { status: 400 });
    }

    // Update submission status
    const result = await db
      .update(submissions)
      .set({ status: 0 }) // 0 = rejected
      .where(eq(submissions.id, submissionId));

    if (result.rowsAffected === 0) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    logger.info("Submission rejected successfully", { 
      submissionId,
      rejectedBy: user.id 
    });

    return new NextResponse("Rejected", { status: 200 });
  } catch (error) {
    logger.error("Error rejecting submission", {
      error: error instanceof Error ? error.message : "Unknown error",
      submissionId: id,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 