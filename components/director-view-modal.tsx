"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare, BarChart3, FileSpreadsheet, FileText } from "lucide-react"
import type { SurveyResponse } from "../types/survey"
import { getScoreDescription } from "../lib/score-utils"
import { DIRECTOR_SECTIONS } from "../lib/survey-data"

interface DirectorViewModalProps {
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

export function DirectorViewModal({ submission, isOpen, onClose }: DirectorViewModalProps) {
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
            const section = DIRECTOR_SECTIONS.find((s) => s.id === sectionId)
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
      link.setAttribute("download", `direct-assessment-${submission.managerName?.replace(/\s+/g, "-")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `direct-assessment-${submission.managerName?.replace(/\s+/g, "-")}.json`)
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
  const sectionScores = DIRECTOR_SECTIONS.map((section) => {
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
            <DialogTitle className="text-xl">Direct Assessment - {submission.managerName}</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(submission.status)}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Direct Assessment
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
            <TabsTrigger value="comments">Direct Feedback</TabsTrigger>
            <TabsTrigger value="export">Export Options</TabsTrigger>
          </TabsList>

          <TabsContent value="responses" className="space-y-6">
            {DIRECTOR_SECTIONS.map((section) => {
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
                  Overall Direct Assessment Score
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

            {/* Individual Question Scores */}
            {DIRECTOR_SECTIONS.map((section) => {
              const sectionResponses = submission.responses[section.id as keyof typeof submission.responses] || {}

              return (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      {section.title} - Question Scores
                    </CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.questions.map((question, questionIndex) => {
                      const response = sectionResponses[question.id]
                      const score =
                        LIKERT_OPTIONS.find((opt) => opt.label.toLowerCase() === response?.toLowerCase())?.weight || 0

                      return (
                        <div key={question.id} className="space-y-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm mb-2 flex-1">
                                Question {questionIndex + 1}: {question.text}
                              </h4>
                              <div
                                className="text-2xl font-bold px-3 py-1 rounded-md text-white ml-2"
                                style={{
                                  backgroundColor:
                                    score >= 4.5
                                      ? "#22c55e"
                                      : score >= 3.5
                                        ? "#4ade80"
                                        : score >= 2.5
                                          ? "#eab308"
                                          : score >= 1.5
                                            ? "#f97316"
                                            : "#ef4444",
                                }}
                              >
                                {score.toFixed(1)}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Response: {response || "No response"}</p>
                          </div>

                          {/* Score visualization */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>1 (Never)</span>
                              <span>5 (Always)</span>
                            </div>
                            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 left-0"
                                style={{
                                  width: `${(score / 5) * 100}%`,
                                  backgroundColor:
                                    score >= 4.5
                                      ? "#22c55e"
                                      : score >= 3.5
                                        ? "#4ade80"
                                        : score >= 2.5
                                          ? "#eab308"
                                          : score >= 1.5
                                            ? "#f97316"
                                            : "#ef4444",
                                }}
                              ></div>
                              <div
                                className="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-sm font-medium"
                                style={{ color: score > 3 ? "white" : "black" }}
                              >
                                {score.toFixed(1)} - {getScoreDescription(score)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Direct Feedback
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Additional feedback and recommendations from the direct assessment
                </p>
              </CardHeader>
              <CardContent>
                {submission.comments ? (
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm">{submission.comments}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No additional feedback provided.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Direct Assessment Data</CardTitle>
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
                  Export the direct assessment results for {submission.managerName} including responses and feedback.
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
