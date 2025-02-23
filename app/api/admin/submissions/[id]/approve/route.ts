import { NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import { db } from '@/db/client';
import { submissions, messages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import logger from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      logger.info("Unauthorized access attempt to approve submission");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await isUserAdmin(user);
    
    if (!isAdmin) {
      logger.info("Non-admin attempt to approve submission", { userId: user.id });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const submissionId = parseInt(params.id);
    if (isNaN(submissionId)) {
      return new NextResponse("Invalid submission ID", { status: 400 });
    }

    // Get the submission
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Insert into messages
      await tx.insert(messages).values({
        msg: submission.msg,
        hash: submission.hash,
        slug: submission.slug,
        date: submission.date,
        clerkUserId: submission.clerkUserId,
        approvalClerkUserId: user.id,
        approvalDate: new Date().toISOString(),
      });

      // Update submission status
      await tx
        .update(submissions)
        .set({ status: 2 }) // 2 = approved
        .where(eq(submissions.id, submissionId));
    });

    logger.info("Submission approved successfully", { 
      submissionId,
      approvedBy: user.id 
    });

    return new NextResponse("Approved", { status: 200 });
  } catch (error) {
    logger.error("Error approving submission", {
      error: error instanceof Error ? error.message : "Unknown error",
      submissionId: params.id,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 