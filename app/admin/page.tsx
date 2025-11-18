import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { submissions } from "@/db/schema";
import { isUserAdmin } from "@/lib/auth";
import logger from "@/lib/logger";
import { AdminSubmissionsTable } from "./admin-submissions-table";

export default async function AdminPage() {
	const user = await currentUser();

	if (!user) {
		logger.info("Unauthorized access attempt to admin page");
		redirect("/");
	}

	const isAdmin = await isUserAdmin(user);

	if (!isAdmin) {
		logger.info("Non-admin access attempt to admin page", { userId: user.id });
		redirect("/");
	}

	try {
		logger.info("Fetching pending submissions for admin review");

		// Fetch all pending submissions
		const pendingSubmissions = await db
			.select({
				id: submissions.id,
				message: submissions.msg,
				date: submissions.date,
				clerkUserId: submissions.clerkUserId,
				submissionStatus: submissions.status,
			})
			.from(submissions)
			.where(
				eq(submissions.status, 1), // pending review
			);

		const processedSubmissions = pendingSubmissions.map((sub) => ({
			id: sub.id,
			message: sub.message || "",
			date: sub.date?.toString() || "",
			clerkUserId: sub.clerkUserId || "",
			submissionStatus: sub.submissionStatus,
		}));

		logger.info("Successfully fetched pending submissions", {
			pendingCount: pendingSubmissions.length,
		});

		return (
			<div className="min-h-screen bg-custom-solitude">
				<div className="container mx-auto py-10">
					<h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
					<div className="space-y-8">
						<div>
							<h2 className="text-xl font-semibold mb-4">
								Pending Submissions
							</h2>
							<AdminSubmissionsTable submissions={processedSubmissions} />
						</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		logger.error("Error fetching submissions for admin", {
			error: error instanceof Error ? error.message : "Unknown error",
			userId: user.id,
		});
		return (
			<div className="min-h-screen bg-custom-solitude">
				<div className="container mx-auto py-10">
					<h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
					<p className="text-red-600">
						Failed to load submissions. Please try again later.
					</p>
				</div>
			</div>
		);
	}
}
