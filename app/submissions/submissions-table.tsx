"use client"

import { DataTable } from "./data-table"
import { columns } from "./columns"

type RawSubmission = {
  id: number
  message: string | null
  date: string | null
  status: "pending" | "approved"
}

interface SubmissionsTableProps {
  submissions: RawSubmission[]
  type: "pending" | "approved"
}

export function SubmissionsTable({ submissions, type }: SubmissionsTableProps) {
  const processedSubmissions = submissions.map(sub => ({
    id: sub.id,
    message: sub.message || '',
    date: sub.date?.toString() || '',
    status: type
  }));

  return (
    <DataTable 
      columns={columns} 
      data={processedSubmissions} 
    />
  );
} 