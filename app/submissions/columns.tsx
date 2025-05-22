"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Submission = {
  id: number
  message: string
  date: string
  status: string
}

export const columns: ColumnDef<Submission>[] = [
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className={`capitalize ${
          status === "Approved" ? "text-green-600" : 
          status === "Not Approved" ? "text-red-600" : 
          "text-yellow-600"
        }`}>
          {status}
        </div>
      );
    },
  },
] 