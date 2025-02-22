import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { submissions, messages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import logger from "@/lib/logger";
import { SubmissionsTable } from "./submissions-table";

export default async function SubmissionsPage() {
  const user = await currentUser();
  
  if (!user) {
    logger.info("Unauthorized access attempt to submissions page");
    redirect("/");
  }

  try {
    logger.info("Fetching submissions for user", { userId: user.id });
    
    // Fetch pending submissions
    const pendingSubmissions = await db
      .select({
        id: submissions.id,
        message: submissions.msg,
        date: submissions.date,
        status: sql<'pending'>`'pending'`.as('status'),
      })
      .from(submissions)
      .where(eq(submissions.clerkUserId, user.id));

    // Fetch approved submissions
    const approvedSubmissions = await db
      .select({
        id: messages.id,
        message: messages.msg,
        date: messages.date,
        status: sql<'approved'>`'approved'`.as('status'),
      })
      .from(messages)
      .where(eq(messages.clerkUserId, user.id));

    logger.info("Successfully fetched submissions", {
      pendingCount: pendingSubmissions.length,
      approvedCount: approvedSubmissions.length,
    });

    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-8">Your Submissions</h1>
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Submissions</h2>
            <SubmissionsTable 
              submissions={pendingSubmissions}
              type="pending"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Approved Submissions</h2>
            <SubmissionsTable 
              submissions={approvedSubmissions}
              type="approved"
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Error fetching submissions", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: user.id,
    });
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Your Submissions</h1>
        <p className="text-red-600">Failed to load submissions. Please try again later.</p>
      </div>
    );
  }
} 