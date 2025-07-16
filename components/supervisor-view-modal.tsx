"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCheck, MessageSquare, BarChart3, FileSpreadsheet, FileText } from "lucide-react"
import type { SurveyResponse } from "../types/survey"
import { getScoreDescription } from "../lib/score-utils"
import { SUPERVISOR_SECTIONS } from "../lib/survey-data"

interface SupervisorViewModalProps {
  submission: SurveyResponse | null
  isOpen: boolean
  onClose: () => void
}

const LIKERT_OPTIONS = [
  { value: "never", label: "Never", color: "bg-red-100 text-red-800", weight: 1 },
  { value: "rarely", label: "Rarely", color: "bg-orange-100 text-orange-800", weight: 2 },
  { value: "sometimes", label: "Sometimes", color: "bg-yellow-100 text-yellow-800", weight: 3 },
  { value: "often", label: "Often", color: "bg-blue-100 text-blue-800", weight: 4 },
  { value: "always", label: "Always", color: "bg-green-100 text-green-800", weight: 5 },
]

export function SupervisorViewModal({ submission, isOpen, onClose }: SupervisorViewModalProps) {
  if (!submission) return null

  const handleExport = (format: "csv" | "json") => {
    const data = {
      managerName: submission.managerName,
      submittedAt: submission.submittedAt,
      type: submission.type,
      responses: submission.responses,
      comments: submission.comments,
    }

    if (format === "csv") {
      const csvContent = [
        ["Manager", "Date", "Type", "Section", "Question", "Response"].join(","),
        ...Object.entries(submission.responses).flatMap(([sectionId, sectionResponses]) =>
          Object.entries(sectionResponses).map(([questionId, response]) => {
            const section = SUPERVISOR_SECTIONS.find((s) => s.id === sectionId)
            const question = section?.questions.find((q) => q.id === questionId)
            return [
              submission.managerName || "",
              submission.submittedAt.toISOString().split("T")[0],
              submission.type,
              section?.title || sectionId,
              `"${question?.text || questionId}"`,
              response,
            ].join(",")
          }),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `self-assessment-${submission.managerName?.replace(/\s+/g, "-")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `self-assessment-${submission.managerName?.replace(/\s+/g, "-")}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      "in-progress": "secondary",
      reviewed: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status.replace("-", " ")}</Badge>
  }

  // Calculate section scores
  const sectionScores = SUPERVISOR_SECTIONS.map((section) => {
    const sectionResponses = submission.responses[section.id as keyof typeof submission.responses] || {}
    const responses = Object.values(sectionResponses)

    if (responses.length === 0) return { sectionId: section.id, sectionTitle: section.title, averageScore: 0 }

    const scoreSum = responses.reduce((sum, response) => {
      const score = LIKERT_OPTIONS.find((opt) => opt.label.toLowerCase() === response.toLowerCase())?.weight || 0
      return sum + score
    }, 0)

    return {
      sectionId: section.id,
      sectionTitle: section.title,
      averageScore: Math.round((scoreSum / responses.length) * 10) / 10,
    }
  })

  // Calculate overall score
  const allScores = sectionScores.map((s) => s.averageScore).filter((s) => s > 0)
  const overallScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10
      : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Self-Assessment - {submission.managerName}</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(submission.status)}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <UserCheck className="h-4 w-4" />
                Self-Assessment
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Submitted: {submission.submittedAt.toLocaleDateString()} at {submission.submittedAt.toLocaleTimeString()}
            {submission.lastModified && (
              <span className="ml-4">Last modified: {submission.lastModified.toLocaleDateString()}</span>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="responses">Individual Responses</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="comments">Self-Reflection</TabsTrigger>
            <TabsTrigger value="export">Export Options</TabsTrigger>
          </TabsList>

          <TabsContent value="responses" className="space-y-6">
            {SUPERVISOR_SECTIONS.map((section) => {
              const sectionResponses = submission.responses[section.id as keyof typeof submission.responses] || {}

              return (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.questions.map((question) => {
                      const response = sectionResponses[question.id]
                      const option = LIKERT_OPTIONS.find((opt) => opt.label.toLowerCase() === response?.toLowerCase())

                      return (
                        <div key={question.id} className="space-y-2">
                          <h4 className="font-medium text-sm">{question.text}</h4>
                          <div className="flex items-center gap-2">
                            {option && (
                              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${option.color}`}>
                                {option.label}
                              </div>
                            )}
                            {!response && (
                              <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                No Response
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Overall Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Overall Self-Assessment Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                  <div
                    className="text-5xl font-bold mb-2 px-6 py-3 rounded-full text-white"
                    style={{
                      backgroundColor:
                        overallScore >= 4.5
                          ? "#22c55e"
                          : overallScore >= 3.5
                            ? "#4ade80"
                            : overallScore >= 2.5
                              ? "#eab308"
                              : overallScore >= 1.5
                                ? "#f97316"
                                : "#ef4444",
                    }}
                  >
                    {overallScore.toFixed(1)}
                  </div>
                  <div className="text-lg font-medium">{getScoreDescription(overallScore)}</div>
                  <div className="text-sm text-gray-500 mt-1">Average score across all competencies</div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Competency Scores</h4>
                  <div className="space-y-4">
                    {sectionScores.map((sectionScore) => (
                      <div key={sectionScore.sectionId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{sectionScore.sectionTitle}</span>
                          <span className="font-medium">{sectionScore.averageScore.toFixed(1)}</span>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span
                                className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white"
                                style={{
                                  backgroundColor:
                                    sectionScore.averageScore >= 4.5
                                      ? "#22c55e"
                                      : sectionScore.averageScore >= 3.5
                                        ? "#4ade80"
                                        : sectionScore.averageScore >= 2.5
                                          ? "#eab308"
                                          : sectionScore.averageScore >= 1.5
                                            ? "#f97316"
                                            : "#ef4444",
                                }}
                              >
                                {getScoreDescription(sectionScore.averageScore)}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{
                                width: `${(sectionScore.averageScore / 5) * 100}%`,
                                backgroundColor:
                                  sectionScore.averageScore >= 4.5
                                    ? "#22c55e"
                                    : sectionScore.averageScore >= 3.5
                                      ? "#4ade80"
                                      : sectionScore.averageScore >= 2.5
                                        ? "#eab308"
                                        : sectionScore.averageScore >= 1.5
                                          ? "#f97316"
                                          : "#ef4444",
                              }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Self-Reflection Comments
                </CardTitle>
                <p className="text-sm text-gray-600">Personal insights and reflections from {submission.managerName}</p>
              </CardHeader>
              <CardContent>
                {submission.comments ? (
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm">{submission.comments}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No self-reflection comments provided.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Self-Assessment Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => handleExport("csv")} className="w-full">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to Spreadsheet
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("json")} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Assessment Report
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Export the self-assessment results for {submission.managerName} including responses and
                  self-reflection comments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
