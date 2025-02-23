"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminDataTable } from "./admin-data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type AdminSubmission = {
  id: number
  message: string
  date: string
  clerkUserId: string
  submissionStatus: number
}

interface AdminSubmissionsTableProps {
  submissions: AdminSubmission[]
}

export function AdminSubmissionsTable({ submissions }: AdminSubmissionsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  const handleApprove = async (id: number) => {
    setProcessingIds(prev => new Set([...prev, id]))
    try {
      const response = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve submission')
      }

      toast({
        title: "Success",
        description: "Submission approved successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve submission",
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleReject = async (id: number) => {
    setProcessingIds(prev => new Set([...prev, id]))
    try {
      const response = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject submission')
      }

      toast({
        title: "Success",
        description: "Submission rejected successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject submission",
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const columns: ColumnDef<AdminSubmission>[] = [
    {
      accessorKey: "message",
      header: "Message",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"))
        return date.toLocaleDateString()
      },
    },
    {
      accessorKey: "clerkUserId",
      header: "Submitted By",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original
        const isProcessing = processingIds.has(submission.id)

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
        )
      },
    },
  ]

  const processedSubmissions = submissions.map(sub => ({
    ...sub,
    message: sub.message || '',
    date: sub.date?.toString() || '',
  }))

  return (
    <AdminDataTable<AdminSubmission>
      columns={columns} 
      data={processedSubmissions} 
    />
  )
} 