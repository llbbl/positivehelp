"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	fetchWithErrorHandling,
	showErrorToast,
	showSuccessToast,
} from "@/lib/client-error-handler";
import { AdminDataTable } from "./admin-data-table";

type AdminSubmission = {
	id: number;
	message: string;
	date: string;
	clerkUserId: string;
	submissionStatus: number;
};

interface AdminSubmissionsTableProps {
	submissions: AdminSubmission[];
}

type UserInfo = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	username: string | null;
};

export function AdminSubmissionsTable({
	submissions,
}: AdminSubmissionsTableProps) {
	const router = useRouter();
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
	const [userInfo, setUserInfo] = useState<Record<string, UserInfo>>({});
	const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		const fetchUserInfo = async (userId: string) => {
			setLoadingUserIds((prev) => new Set([...prev, userId]));
			try {
				const response = await fetch(`/api/admin/users/${userId}`);
				if (response.ok) {
					const data = await response.json();
					setUserInfo((prev) => ({
						...prev,
						[userId]: data,
					}));
				}
			} catch (error) {
				console.error("Error fetching user info:", error);
			} finally {
				setLoadingUserIds((prev) => {
					const newSet = new Set(prev);
					newSet.delete(userId);
					return newSet;
				});
			}
		};

		// Fetch user info for all unique user IDs
		const uniqueUserIds = new Set(submissions.map((sub) => sub.clerkUserId));
		uniqueUserIds.forEach((userId) => {
			if (userId && !userInfo[userId]) {
				fetchUserInfo(userId);
			}
		});
	}, [submissions, userInfo]);

	const handleApprove = async (id: number) => {
		setProcessingIds((prev) => new Set([...prev, id]));

		try {
			await fetchWithErrorHandling(
				`/api/admin/submissions/${id}/approve`,
				{ method: "POST" },
				"submission approval",
			);

			showSuccessToast("Success", "Submission approved successfully");
			router.refresh();
		} catch (error) {
			showErrorToast(error, "Failed to approve submission");
		} finally {
			setProcessingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	};

	const handleReject = async (id: number) => {
		setProcessingIds((prev) => new Set([...prev, id]));

		try {
			await fetchWithErrorHandling(
				`/api/admin/submissions/${id}/reject`,
				{ method: "POST" },
				"submission rejection",
			);

			showSuccessToast("Success", "Submission rejected successfully");
			router.refresh();
		} catch (error) {
			showErrorToast(error, "Failed to reject submission");
		} finally {
			setProcessingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	};

	const columns: ColumnDef<AdminSubmission>[] = [
		{
			accessorKey: "message",
			header: "Message",
		},
		{
			accessorKey: "date",
			header: "Date",
			cell: ({ row }) => {
				const date = new Date(row.getValue("date"));
				return date.toLocaleDateString();
			},
		},
		{
			accessorKey: "clerkUserId",
			header: "Submitted By",
			cell: ({ row }) => {
				const userId = row.getValue("clerkUserId") as string;
				const user = userInfo[userId];
				const isLoading = loadingUserIds.has(userId);

				if (isLoading) {
					return (
						<div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
					);
				}

				if (!user) return userId;
				return user.firstName && user.lastName
					? `${user.firstName} ${user.lastName} (${user.username})`
					: user.username || userId;
			},
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const submission = row.original;
				const isProcessing = processingIds.has(submission.id);

				return (
					<div className="flex gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleApprove(submission.id)}
							disabled={isProcessing}
							className="hover:text-green-600"
						>
							<ThumbsUp className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleReject(submission.id)}
							disabled={isProcessing}
							className="hover:text-red-600"
						>
							<ThumbsDown className="h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
	];

	const processedSubmissions = submissions.map((sub) => ({
		...sub,
		message: sub.message || "",
		date: sub.date?.toString() || "",
	}));

	return (
		<AdminDataTable<AdminSubmission>
			columns={columns}
			data={processedSubmissions}
		/>
	);
}
