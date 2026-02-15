"use client";

import { SUBMISSION_STATUS } from "@/lib/constants";
import { columns } from "./columns";
import { DataTable } from "./data-table";

type RawSubmission = {
	id: number;
	message: string | null;
	date: string | null;
	submissionStatus: number;
};

interface SubmissionsTableProps {
	submissions: RawSubmission[];
	type: "pending" | "denied" | "approved";
}

function getStatusDisplay(status: number): string {
	switch (status) {
		case SUBMISSION_STATUS.DENIED:
			return "Not Approved";
		case SUBMISSION_STATUS.PENDING:
			return "Pending Review";
		case SUBMISSION_STATUS.APPROVED:
			return "Approved";
		default:
			return "Unknown";
	}
}

export function SubmissionsTable({ submissions, type: _type }: SubmissionsTableProps) {
	const processedSubmissions = submissions.map((sub) => ({
		id: sub.id,
		message: sub.message || "",
		date: sub.date?.toString() || "",
		status: getStatusDisplay(sub.submissionStatus),
	}));

	return <DataTable columns={columns} data={processedSubmissions} />;
}
