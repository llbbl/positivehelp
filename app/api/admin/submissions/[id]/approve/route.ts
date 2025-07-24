import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs/server";
import { isUserAdmin } from '@/lib/auth';
import { db } from '@/db/client';
import { submissions, messages, authors, message_authors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  let id = '';
  
  try {
    ({ id } = await context.params);
    const submissionId = parseInt(id);
    
    logger.info("Processing approval request", { 
      submissionId
    });

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

    if (isNaN(submissionId) || submissionId <= 0) {
      return new NextResponse("Invalid submission ID", { status: 400 });
    }

    // Get the submission
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      logger.warn("Submission not found for approval", { submissionId });
      return new NextResponse("Submission not found", { status: 404 });
    }

    if (submission.status === 2) {
      logger.warn("Attempt to approve already approved submission", { submissionId });
      return new NextResponse("Submission already approved", { status: 400 });
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
        throw new Error('Failed to get inserted message ID');
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
          await tx
            .insert(message_authors)
            .values({
              messageId: insertedMessage.id,
              authorId: existingAuthor.id,
            });
        }
      }

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
      submissionId: id,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 