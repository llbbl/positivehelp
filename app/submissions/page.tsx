import { currentUser } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { messages, submissions } from "@/db/schema";
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

		// Fetch pending (not reviewed) submissions
		const pendingSubmissions = await db
			.select({
				id: submissions.id,
				message: submissions.msg,
				date: submissions.date,
				submissionStatus: submissions.status,
			})
			.from(submissions)
			.where(
				and(
					eq(submissions.clerkUserId, user.id),
					eq(submissions.status, 1), // not reviewed
				),
			);

		// Fetch denied submissions
		const deniedSubmissions = await db
			.select({
				id: submissions.id,
				message: submissions.msg,
				date: submissions.date,
				submissionStatus: submissions.status,
			})
			.from(submissions)
			.where(
				and(
					eq(submissions.clerkUserId, user.id),
					eq(submissions.status, 0), // denied
				),
			);

		// Fetch approved submissions (from messages table)
		const approvedSubmissions = await db
			.select({
				id: messages.id,
				message: messages.msg,
				date: messages.date,
				submissionStatus: sql<2>`2`.as("submissionStatus"), // approved
			})
			.from(messages)
			.where(eq(messages.clerkUserId, user.id))
			.orderBy(sql`${messages.date} DESC`);

		logger.info("Successfully fetched submissions", {
			pendingCount: pendingSubmissions.length,
			deniedCount: deniedSubmissions.length,
			approvedCount: approvedSubmissions.length,
		});

		return (
			<div className="min-h-screen bg-custom-solitude">
				<div className="container mx-auto py-10">
					<h1 className="text-2xl font-bold mb-8">Your Submissions</h1>
					<div className="space-y-8">
						<div>
							<h2 className="text-xl font-semibold mb-4">Pending Review</h2>
							<SubmissionsTable
								submissions={pendingSubmissions}
								type="pending"
							/>
						</div>
						<div>
							<h2 className="text-xl font-semibold mb-4">Approved</h2>
							<SubmissionsTable
								submissions={approvedSubmissions}
								type="approved"
							/>
						</div>
						<div>
							<h2 className="text-xl font-semibold mb-4">Not Approved</h2>
							<SubmissionsTable submissions={deniedSubmissions} type="denied" />
						</div>
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
			<div className="min-h-screen bg-custom-solitude">
				<div className="container mx-auto py-10">
					<h1 className="text-2xl font-bold mb-4">Your Submissions</h1>
					<p className="text-red-600">
						Failed to load submissions. Please try again later.
					</p>
				</div>
			</div>
		);
	}
}
