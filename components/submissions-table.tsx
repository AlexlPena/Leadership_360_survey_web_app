"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Eye, Trash2, FileSpreadsheet } from "lucide-react"
import type { SurveySubmission } from "@/types/survey"
import { exportToCSV } from "@/utils/export"

interface SubmissionsTableProps {
  submissions: SurveySubmission[]
  onView: (submission: SurveySubmission) => void
  onDelete: (submissionId: string) => void
  getSubmissionTypeBadge: (type: string) => React.ReactNode
}

export function SubmissionsTable({ submissions, onView, onDelete, getSubmissionTypeBadge }: SubmissionsTableProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission | null>(null)

  const handleExportClick = (submission: SurveySubmission) => {
    setSelectedSubmission(submission)
    setIsExportModalOpen(true)
  }

  const handleExportSingle = () => {
    if (!selectedSubmission) return

    // Create a flattened version of the data for CSV export
    const exportData = [
      {
        Type: selectedSubmission.type,
        ID: selectedSubmission.surveyId,
        "Employee Name": selectedSubmission.employeeName || "",
        "Supervisor Name": selectedSubmission.supervisorName || "",
        "Director Name": selectedSubmission.directorName || "",
        "Manager Name": selectedSubmission.managerName || "",
        "Submitted At": new Date(selectedSubmission.submittedAt).toLocaleString(),
        Status: selectedSubmission.status,
      },
    ]

    exportToCSV(exportData, `${selectedSubmission.managerName}-survey-data-${new Date().toISOString().split("T")[0]}`)
    setIsExportModalOpen(false)
  }

  const handleExportAll = () => {
    // Create a flattened version of all data for CSV export
    const exportData = submissions.map((submission) => {
      return {
        Type: submission.type,
        ID: submission.surveyId,
        "Employee Name": submission.employeeName || "",
        "Supervisor Name": submission.supervisorName || "",
        "Director Name": submission.directorName || "",
        "Manager Name": submission.managerName || "",
        "Submitted At": new Date(submission.submittedAt).toLocaleString(),
        Status: submission.status,
      }
    })

    exportToCSV(exportData, `all-managers-survey-data-${new Date().toISOString().split("T")[0]}`)
    setIsExportModalOpen(false)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No submissions found.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.surveyId}>
                  <TableCell>{getSubmissionTypeBadge(submission.type)}</TableCell>
                  <TableCell className="font-mono text-xs">{submission.surveyId}</TableCell>
                  <TableCell>{submission.managerName}</TableCell>
                  <TableCell>
                    {submission.type === "employee" && submission.employeeName}
                    {submission.type === "supervisor" && submission.supervisorName}
                    {submission.type === "director" && submission.directorName}
                    {submission.type === "manager" && "System"}
                  </TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(submission)}
                        title="View submission details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportClick(submission)}
                        title="Export data"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(submission.surveyId)}
                        title="Delete submission"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Survey Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">Choose which data you would like to export to a spreadsheet:</p>
            <div className="flex flex-col gap-4">
              <Button onClick={handleExportSingle} className="w-full">
                Export data for {selectedSubmission?.managerName || "selected manager"}
              </Button>
              <Button onClick={handleExportAll} variant="outline" className="w-full">
                Export data for all managers
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
