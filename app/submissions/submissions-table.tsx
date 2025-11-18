"use client";

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
		case 0:
			return "Not Approved";
		case 1:
			return "Pending Review";
		case 2:
			return "Approved";
		default:
			return "Unknown";
	}
}

export function SubmissionsTable({ submissions, type }: SubmissionsTableProps) {
	const processedSubmissions = submissions.map((sub) => ({
		id: sub.id,
		message: sub.message || "",
		date: sub.date?.toString() || "",
		status: getStatusDisplay(sub.submissionStatus),
	}));

	return <DataTable columns={columns} data={processedSubmissions} />;
}
