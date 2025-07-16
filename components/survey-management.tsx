"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ViewEditModal } from "@/components/view-edit-modal"
import { SupervisorViewModal } from "@/components/supervisor-view-modal"
import { DirectorViewModal } from "@/components/director-view-modal"
import { ManagerViewModal } from "@/components/manager-view-modal"
import type { SurveySubmission } from "@/types/survey"
import { dataStore } from "@/lib/data-store"
import { SubmissionsTable } from "@/components/submissions-table"
import { Download, Plus, Search } from "lucide-react"
import { exportToCSV } from "@/utils/export"

export function SurveyManagement() {
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<SurveySubmission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false)
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false)
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadSubmissions = async () => {
      const allSubmissions = await dataStore.getAllSubmissions()
      setSubmissions(allSubmissions)
      setFilteredSubmissions(allSubmissions)
    }

    loadSubmissions()
  }, [])

  useEffect(() => {
    let filtered = submissions

    // Filter by type based on active tab
    if (activeTab !== "all") {
      filtered = filtered.filter((submission) => submission.type === activeTab)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((submission) => {
        return (
          (submission.employeeName && submission.employeeName.toLowerCase().includes(term)) ||
          (submission.supervisorName && submission.supervisorName.toLowerCase().includes(term)) ||
          (submission.directorName && submission.directorName.toLowerCase().includes(term)) ||
          (submission.managerName && submission.managerName.toLowerCase().includes(term)) ||
          submission.surveyId.toLowerCase().includes(term)
        )
      })
    }

    setFilteredSubmissions(filtered)
  }, [submissions, searchTerm, activeTab])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleViewSubmission = (submission: SurveySubmission) => {
    setSelectedSubmission(submission)

    if (submission.type === "employee") {
      setIsViewModalOpen(true)
    } else if (submission.type === "supervisor") {
      setIsSupervisorModalOpen(true)
    } else if (submission.type === "director") {
      setIsDirectorModalOpen(true)
    } else if (submission.type === "manager") {
      setIsManagerModalOpen(true)
    } else {
      setIsViewModalOpen(true)
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (window.confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      await dataStore.deleteSubmission(submissionId)
      setSubmissions((prev) => prev.filter((s) => s.surveyId !== submissionId))
    }
  }

  const handleExportAll = () => {
    // Create a flattened version of the data for CSV export
    const exportData = filteredSubmissions.map((submission) => {
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

    exportToCSV(exportData, `leadership-survey-submissions-${new Date().toISOString().split("T")[0]}`)
  }

  const getSubmissionTypeLabel = (type: string) => {
    switch (type) {
      case "employee":
        return "Self Assessment"
      case "supervisor":
        return "Peer Assessment"
      case "director":
        return "Direct Assessment"
      case "manager":
        return "Manager Assessment"
      case "custom":
        return "Custom Survey"
      default:
        return type
    }
  }

  const getSubmissionTypeBadge = (type: string) => {
    switch (type) {
      case "employee":
        return <Badge className="bg-blue-500">Self Assessment</Badge>
      case "supervisor":
        return <Badge className="bg-purple-500">Peer Assessment</Badge>
      case "director":
        return <Badge className="bg-green-500">Direct Assessment</Badge>
      case "manager":
        return <Badge className="bg-orange-500">Manager Assessment</Badge>
      case "custom":
        return <Badge className="bg-gray-500">Custom Survey</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Survey Submissions</CardTitle>
            <CardDescription>View and manage all leadership survey submissions</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportAll} className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </Button>
            <Button size="sm" className="flex items-center space-x-1">
              <Plus className="h-4 w-4" />
              <span>Create Survey</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="employee">Self</TabsTrigger>
                <TabsTrigger value="supervisor">Peer</TabsTrigger>
                <TabsTrigger value="director">Direct</TabsTrigger>
                <TabsTrigger value="manager">Manager</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search submissions..." value={searchTerm} onChange={handleSearch} className="pl-8" />
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <SubmissionsTable
              submissions={filteredSubmissions}
              onView={handleViewSubmission}
              onDelete={handleDeleteSubmission}
              getSubmissionTypeBadge={getSubmissionTypeBadge}
            />
          </TabsContent>

          <TabsContent value="employee" className="m-0">
            <SubmissionsTable
              submissions={filteredSubmissions}
              onView={handleViewSubmission}
              onDelete={handleDeleteSubmission}
              getSubmissionTypeBadge={getSubmissionTypeBadge}
            />
          </TabsContent>

          <TabsContent value="supervisor" className="m-0">
            <SubmissionsTable
              submissions={filteredSubmissions}
              onView={handleViewSubmission}
              onDelete={handleDeleteSubmission}
              getSubmissionTypeBadge={getSubmissionTypeBadge}
            />
          </TabsContent>

          <TabsContent value="director" className="m-0">
            <SubmissionsTable
              submissions={filteredSubmissions}
              onView={handleViewSubmission}
              onDelete={handleDeleteSubmission}
              getSubmissionTypeBadge={getSubmissionTypeBadge}
            />
          </TabsContent>

          <TabsContent value="manager" className="m-0">
            <SubmissionsTable
              submissions={filteredSubmissions}
              onView={handleViewSubmission}
              onDelete={handleDeleteSubmission}
              getSubmissionTypeBadge={getSubmissionTypeBadge}
            />
          </TabsContent>
        </div>
      </CardContent>

      {selectedSubmission && selectedSubmission.type === "employee" && (
        <ViewEditModal
          submission={selectedSubmission}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {selectedSubmission && selectedSubmission.type === "supervisor" && (
        <SupervisorViewModal
          submission={selectedSubmission}
          isOpen={isSupervisorModalOpen}
          onClose={() => setIsSupervisorModalOpen(false)}
        />
      )}

      {selectedSubmission && selectedSubmission.type === "director" && (
        <DirectorViewModal
          submission={selectedSubmission}
          isOpen={isDirectorModalOpen}
          onClose={() => setIsDirectorModalOpen(false)}
        />
      )}

      {selectedSubmission && selectedSubmission.type === "manager" && (
        <ManagerViewModal
          submission={selectedSubmission}
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
        />
      )}
    </Card>
  )
}
