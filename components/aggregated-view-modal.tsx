"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BarChart3, UserCog, User, UserCheck, ArrowLeftRight, TrendingUp, MessageSquare } from "lucide-react"
import type { AggregatedSubmission } from "../types/survey"
import { calculateScore, getScoreDescription } from "../lib/score-utils"
import { EMPLOYEE_SECTIONS, SUPERVISOR_SECTIONS, DIRECTOR_SECTIONS, MANAGER_SECTIONS } from "../lib/survey-data"
import { useState } from "react"

interface AggregatedViewModalProps {
  submission: AggregatedSubmission | null
  isOpen: boolean
  onClose: () => void
}

const LIKERT_OPTIONS = [
  { value: "never", label: "Never", color: "bg-red-100 text-red-800", chartColor: "#ef4444", weight: 1 },
  { value: "rarely", label: "Rarely", color: "bg-orange-100 text-orange-800", chartColor: "#f97316", weight: 2 },
  { value: "sometimes", label: "Sometimes", color: "bg-yellow-100 text-yellow-800", chartColor: "#eab308", weight: 3 },
  { value: "often", label: "Often", color: "bg-blue-100 text-blue-800", chartColor: "#3b82f6", weight: 4 },
  { value: "always", label: "Always", color: "bg-green-100 text-green-800", chartColor: "#22c55e", weight: 5 },
]

export function AggregatedViewModal({ submission, isOpen, onClose }: AggregatedViewModalProps) {
  const [selectedAnalyticsView, setSelectedAnalyticsView] = useState<"peer" | "direct" | "manager" | "self">("peer")

  if (!submission) return null

  const exportToCSV = () => {
    // Prepare CSV content
    let csvContent = "Section,Question,Never,Rarely,Sometimes,Often,Always,Average Score\r\n"

    submission.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const totalResponses =
          question.responses.never +
          question.responses.rarely +
          question.responses.sometimes +
          question.responses.often +
          question.responses.always

        const weightedSum =
          question.responses.never * 1 +
          question.responses.rarely * 2 +
          question.responses.sometimes * 3 +
          question.responses.often * 4 +
          question.responses.always * 5

        const averageScore = totalResponses > 0 ? weightedSum / totalResponses : 0

        const row = [
          section.title.replace(/,/g, ""), // Remove commas from section title
          question.questionText.replace(/,/g, ""), // Remove commas from question text
          question.responses.never,
          question.responses.rarely,
          question.responses.sometimes,
          question.responses.often,
          question.responses.always,
          averageScore.toFixed(2),
        ].join(",")
        csvContent += row + "\r\n"
      })
    })

    // Add comments to the CSV
    csvContent += "\r\nComments:\r\n"
    submission.comments.forEach((comment, index) => {
      csvContent += `Employee #${index + 1},"${comment.replace(/"/g, '""')}"\r\n` // Escape quotes properly
    })

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `survey_overview_${submission.managerName.replace(/\s+/g, "_")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      "in-progress": "secondary",
      reviewed: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status.replace("-", " ")}</Badge>
  }

  // Get the actual question text from the survey data
  const getQuestionText = (sectionId: string, questionId: string, surveyType = "employee"): string => {
    // Try to find the question in each survey type
    const findInSections = (sections: any[]) => {
      const section = sections.find((s) => s.id === sectionId)
      if (section) {
        const question = section.questions.find((q: any) => q.id === questionId)
        if (question) return question.text
      }
      return null
    }

    // For self assessment, we want to use the supervisor sections (which are in first person)
    // For all other types, we want to use the employee sections (which are in third person)
    if (surveyType === "supervisor") {
      return (
        findInSections(SUPERVISOR_SECTIONS) ||
        findInSections(EMPLOYEE_SECTIONS) ||
        findInSections(DIRECTOR_SECTIONS) ||
        findInSections(MANAGER_SECTIONS) ||
        questionId
      )
    } else {
      // Always prioritize employee sections for third-person format
      return (
        findInSections(EMPLOYEE_SECTIONS) ||
        findInSections(DIRECTOR_SECTIONS) ||
        findInSections(MANAGER_SECTIONS) ||
        questionId
      )
    }
  }

  // Calculate overall score for a survey type
  const calculateOverallScore = (sections?: any[]): number => {
    if (!sections || sections.length === 0) return 0

    const sectionScores = sections.map((section) => {
      const questionScores = section.questions.map((question) => calculateScore(question.responses))
      const totalScore = questionScores.reduce((sum, score) => sum + score, 0)
      return questionScores.length > 0 ? totalScore / questionScores.length : 0
    })

    return sectionScores.length > 0
      ? Math.round((sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length) * 10) / 10
      : 0
  }

  // Generic analytics component for any survey type
  const AnalyticsContent = ({
    sections,
    surveyType,
    surveyTypeName,
    icon: Icon,
    color,
    count,
  }: {
    sections?: any[]
    surveyType: string
    surveyTypeName: string
    icon: any
    color: string
    count: number
  }) => {
    if (!sections || sections.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <p>
              No {surveyTypeName.toLowerCase()} assessment data available for {submission.managerName}.
            </p>
            <p className="text-sm mt-2">Expected survey type: {surveyType} submissions</p>
            <p className="text-sm">
              Current {surveyType} count: {count}
            </p>
          </CardContent>
        </Card>
      )
    }

    // Calculate section scores
    const sectionScores = sections.map((section) => {
      const questionScores = section.questions.map((question) => calculateScore(question.responses))
      const totalScore = questionScores.reduce((sum, score) => sum + score, 0)
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        averageScore: questionScores.length > 0 ? Math.round((totalScore / questionScores.length) * 10) / 10 : 0,
      }
    })

    // Calculate overall score
    const overallScore = calculateOverallScore(sections)

    return (
      <>
        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Icon className={`h-5 w-5 mr-2 ${color}`} />
              {surveyTypeName} Assessment - Overall Performance Score
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
              <div className="text-sm text-gray-500 mt-1">
                Average score from {count} {surveyTypeName.toLowerCase()} assessment{count !== 1 ? "s" : ""}
              </div>
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
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className={`h-5 w-5 mr-2 ${color}`} />
                {section.title} - Question Scores
              </CardTitle>
              <p className="text-sm text-gray-600">
                How often does {submission.managerName} practice the following behaviors related to {section.title}?
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((question, questionIndex) => {
                const score = calculateScore(question.responses)
                const totalResponses = Object.values(question.responses).reduce((sum, count) => sum + count, 0)
                // Use the appropriate question text format based on survey type
                const actualQuestionText = getQuestionText(section.id, question.questionId, surveyType)

                return (
                  <div key={question.questionId} className="space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm mb-2 flex-1">
                          Question {questionIndex + 1}: {actualQuestionText || question.questionText}
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
                      <p className="text-xs text-gray-500">
                        Total responses: {totalResponses} / {count}
                      </p>
                    </div>

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
        ))}
      </>
    )
  }

  // Comparison component
  const ComparisonContent = () => {
    // Calculate scores for each assessment type
    const peerScore = calculateOverallScore(submission.peerSections)
    const directScore = calculateOverallScore(submission.directSections)
    const managerScore = calculateOverallScore(submission.managerSections)
    const selfScore = calculateOverallScore(submission.selfSections)

    // Calculate Leadership Score From Others (weighted average of Peer, Direct, Manager)
    const otherScores = [
      { score: peerScore, count: submission.surveyTypeCounts?.peer || 0 },
      { score: directScore, count: submission.surveyTypeCounts?.direct || 0 },
      { score: managerScore, count: submission.surveyTypeCounts?.manager || 0 },
    ].filter((item) => item.count > 0)

    const leadershipFromOthersScore =
      otherScores.length > 0
        ? Math.round(
            (otherScores.reduce((sum, item) => sum + item.score * item.count, 0) /
              otherScores.reduce((sum, item) => sum + item.count, 0)) *
              10,
          ) / 10
        : 0

    // Get all section types for overall comparison
    const allSectionTypes = [
      {
        name: "Peer & Colleague",
        sections: submission.peerSections,
        color: "text-purple-600",
        count: submission.surveyTypeCounts?.peer || 0,
        score: peerScore,
      },
      {
        name: "Direct Report",
        sections: submission.directSections,
        color: "text-green-600",
        count: submission.surveyTypeCounts?.direct || 0,
        score: directScore,
      },
      {
        name: "Manager",
        sections: submission.managerSections,
        color: "text-orange-600",
        count: submission.surveyTypeCounts?.manager || 0,
        score: managerScore,
      },
      {
        name: "Self",
        sections: submission.selfSections,
        color: "text-blue-600",
        count: submission.surveyTypeCounts?.self || 0,
        score: selfScore,
      },
    ]

    // Get all unique section titles across all survey types
    const allSectionTitles = new Set<string>()
    allSectionTypes.forEach((type) => {
      if (type.sections) {
        type.sections.forEach((section) => {
          allSectionTitles.add(section.title)
        })
      }
    })

    // Calculate scores by competency across all survey types
    const competencyScores = Array.from(allSectionTitles).map((title) => {
      const scores = allSectionTypes.map((type) => {
        if (!type.sections) return { name: type.name, score: 0, color: type.color }

        const section = type.sections.find((s) => s.title === title)
        if (!section) return { name: type.name, score: 0, color: type.color }

        const questionScores = section.questions.map((question) => calculateScore(question.responses))
        const totalScore = questionScores.reduce((sum, score) => sum + score, 0)
        const avgScore = questionScores.length > 0 ? Math.round((totalScore / questionScores.length) * 10) / 10 : 0

        return { name: type.name, score: avgScore, color: type.color }
      })

      return { title, scores }
    })

    // Get the actual question text from the survey data (prioritize third-person format)
    const getThirdPersonQuestionText = (sectionId: string, questionId: string): string => {
      // Try to find the question in other survey types first (third-person format)
      const findInSections = (sections: any[]) => {
        const section = sections.find((s) => s.id === sectionId)
        if (section) {
          const question = section.questions.find((q: any) => q.id === questionId)
          if (question) return question.text
        }
        return null
      }

      // Check in this order: Supervisor (Peer), Director (Direct), Manager, then Employee (Self) as fallback
      return (
        findInSections(EMPLOYEE_SECTIONS) ||
        findInSections(DIRECTOR_SECTIONS) ||
        findInSections(MANAGER_SECTIONS) ||
        findInSections(SUPERVISOR_SECTIONS) ||
        questionId
      ) // Fallback to question ID if not found
    }

    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ArrowLeftRight className="h-5 w-5 mr-2" />
              Overall Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Score Comparison */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Overall Scores by Assessment Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allSectionTypes.map((type) => (
                      <div key={type.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${type.color.replace("text-", "bg-")} mr-2`}></div>
                            <span className="text-sm">{type.name} Assessment</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium">{type.score.toFixed(1)}</span>
                            <span className="text-xs text-gray-500 ml-1">({type.count})</span>
                          </div>
                        </div>
                        <div className="relative h-2">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                            <div
                              style={{
                                width: `${(type.score / 5) * 100}%`,
                                backgroundColor:
                                  type.score >= 4.5
                                    ? "#22c55e"
                                    : type.score >= 3.5
                                      ? "#4ade80"
                                      : type.score >= 2.5
                                        ? "#eab308"
                                        : type.score >= 1.5
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
                </CardContent>
              </Card>

              {/* Leadership Score Comparison */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Leadership Score Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Leadership Score From Others */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Leadership Score From Others</span>
                        <span className="text-lg font-bold">{leadershipFromOthersScore.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Combined weighted average of Peer & Colleague, Direct Report & Manager assessments
                      </div>
                      <div className="relative h-3">
                        <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                          <div
                            style={{
                              width: `${(leadershipFromOthersScore / 5) * 100}%`,
                              backgroundColor:
                                leadershipFromOthersScore >= 4.5
                                  ? "#22c55e"
                                  : leadershipFromOthersScore >= 3.5
                                    ? "#4ade80"
                                    : leadershipFromOthersScore >= 2.5
                                      ? "#eab308"
                                      : leadershipFromOthersScore >= 1.5
                                        ? "#f97316"
                                        : "#ef4444",
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Self Leadership Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Self Leadership Score</span>
                        <span className="text-lg font-bold">{selfScore.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Self-assessment score ({submission.surveyTypeCounts?.self || 0} submission
                        {(submission.surveyTypeCounts?.self || 0) !== 1 ? "s" : ""})
                      </div>
                      <div className="relative h-3">
                        <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                          <div
                            style={{
                              width: `${(selfScore / 5) * 100}%`,
                              backgroundColor:
                                selfScore >= 4.5
                                  ? "#22c55e"
                                  : selfScore >= 3.5
                                    ? "#4ade80"
                                    : selfScore >= 2.5
                                      ? "#eab308"
                                      : selfScore >= 1.5
                                        ? "#f97316"
                                        : "#ef4444",
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Insight */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-700">
                        {leadershipFromOthersScore > selfScore + 0.3 ? (
                          <span className="text-green-600">
                            ✅ Others rate leadership higher than self-assessment (+
                            {(leadershipFromOthersScore - selfScore).toFixed(1)})
                          </span>
                        ) : selfScore > leadershipFromOthersScore + 0.3 ? (
                          <span className="text-orange-600">
                            ⚠️ Self-assessment higher than others' ratings (+
                            {(selfScore - leadershipFromOthersScore).toFixed(1)})
                          </span>
                        ) : (
                          <span className="text-blue-600">
                            ⚖️ Self and others' assessments are well aligned (±
                            {Math.abs(selfScore - leadershipFromOthersScore).toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competency Comparison */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Competency Scores by Assessment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {competencyScores.map((competency) => (
                    <div key={competency.title} className="space-y-2">
                      <h4 className="font-medium text-sm">{competency.title}</h4>
                      <div className="space-y-3">
                        {competency.scores.map((score) => (
                          <div key={`${competency.title}-${score.name}`} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full ${score.color.replace("text-", "bg-")} mr-2`}
                                ></div>
                                <span className="text-xs">{score.name}</span>
                              </div>
                              <span className="text-xs font-medium">{score.score.toFixed(1)}</span>
                            </div>
                            <div className="relative h-1.5">
                              <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200">
                                <div
                                  style={{
                                    width: `${(score.score / 5) * 100}%`,
                                    backgroundColor:
                                      score.score >= 4.5
                                        ? "#22c55e"
                                        : score.score >= 3.5
                                          ? "#4ade80"
                                          : score.score >= 2.5
                                            ? "#eab308"
                                            : score.score >= 1.5
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Question-by-Question Comparison */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Question-by-Question Comparison</CardTitle>
            <p className="text-sm text-gray-600">
              Compare how {submission.managerName} rates themselves vs. how others rate them on each question
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Get all unique questions across all sections */}
              {(() => {
                // Collect all questions from all survey types
                const allQuestions = new Map<
                  string,
                  {
                    questionText: string
                    selfScore: number
                    othersScore: number
                    sectionTitle: string
                  }
                >()

                // Helper function to add questions from a survey type
                const addQuestionsFromSurvey = (sections: any[], isOthers: boolean) => {
                  if (!sections) return

                  sections.forEach((section) => {
                    section.questions.forEach((question) => {
                      const questionKey = `${section.id}-${question.questionId}`
                      const score = calculateScore(question.responses)
                      const actualQuestionText = getThirdPersonQuestionText(section.id, question.questionId)

                      if (!allQuestions.has(questionKey)) {
                        allQuestions.set(questionKey, {
                          questionText: actualQuestionText || question.questionText,
                          selfScore: 0,
                          othersScore: 0,
                          sectionTitle: section.title,
                        })
                      }

                      const existing = allQuestions.get(questionKey)!
                      if (isOthers) {
                        // For others, we need to calculate weighted average of peer, direct, manager
                        const peerSection = submission.peerSections?.find((s) => s.id === section.id)
                        const directSection = submission.directSections?.find((s) => s.id === section.id)
                        const managerSection = submission.managerSections?.find((s) => s.id === section.id)

                        const scores = []
                        if (peerSection) {
                          const peerQ = peerSection.questions.find((q) => q.questionId === question.questionId)
                          if (peerQ)
                            scores.push({
                              score: calculateScore(peerQ.responses),
                              weight: submission.surveyTypeCounts?.peer || 0,
                            })
                        }
                        if (directSection) {
                          const directQ = directSection.questions.find((q) => q.questionId === question.questionId)
                          if (directQ)
                            scores.push({
                              score: calculateScore(directQ.responses),
                              weight: submission.surveyTypeCounts?.direct || 0,
                            })
                        }
                        if (managerSection) {
                          const managerQ = managerSection.questions.find((q) => q.questionId === question.questionId)
                          if (managerQ)
                            scores.push({
                              score: calculateScore(managerQ.responses),
                              weight: submission.surveyTypeCounts?.manager || 0,
                            })
                        }

                        const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
                        const weightedScore =
                          totalWeight > 0 ? scores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight : 0

                        existing.othersScore = Math.round(weightedScore * 10) / 10
                      } else {
                        existing.selfScore = score
                      }
                    })
                  })
                }

                // Add questions from self assessment
                addQuestionsFromSurvey(submission.selfSections || [], false)

                // Add questions from others (peer, direct, manager) - we'll process this differently
                if (submission.peerSections || submission.directSections || submission.managerSections) {
                  // Process each section to get the combined others score
                  const allSectionIds = new Set<string>()
                  submission.peerSections?.forEach((s) => allSectionIds.add(s.id))
                  submission.directSections?.forEach((s) => allSectionIds.add(s.id))
                  submission.managerSections?.forEach((s) => allSectionIds.add(s.id))

                  allSectionIds.forEach((sectionId) => {
                    const peerSection = submission.peerSections?.find((s) => s.id === sectionId)
                    const directSection = submission.directSections?.find((s) => s.id === sectionId)
                    const managerSection = submission.managerSections?.find((s) => s.id === sectionId)

                    // Get all unique question IDs in this section
                    const questionIds = new Set<string>()
                    peerSection?.questions.forEach((q) => questionIds.add(q.questionId))
                    directSection?.questions.forEach((q) => questionIds.add(q.questionId))
                    managerSection?.questions.forEach((q) => questionIds.add(q.questionId))

                    questionIds.forEach((questionId) => {
                      const questionKey = `${sectionId}-${questionId}`

                      // Calculate weighted average for this question across peer, direct, manager
                      const scores = []
                      if (peerSection) {
                        const peerQ = peerSection.questions.find((q) => q.questionId === questionId)
                        if (peerQ)
                          scores.push({
                            score: calculateScore(peerQ.responses),
                            weight: submission.surveyTypeCounts?.peer || 0,
                          })
                      }
                      if (directSection) {
                        const directQ = directSection.questions.find((q) => q.questionId === questionId)
                        if (directQ)
                          scores.push({
                            score: calculateScore(directQ.responses),
                            weight: submission.surveyTypeCounts?.direct || 0,
                          })
                      }
                      if (managerSection) {
                        const managerQ = managerSection.questions.find((q) => q.questionId === questionId)
                        if (managerQ)
                          scores.push({
                            score: calculateScore(managerQ.responses),
                            weight: submission.surveyTypeCounts?.manager || 0,
                          })
                      }

                      const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
                      const weightedScore =
                        totalWeight > 0 ? scores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight : 0

                      if (!allQuestions.has(questionKey)) {
                        // Get question text from any available source
                        const questionText = getThirdPersonQuestionText(sectionId, questionId)
                        const sectionTitle =
                          peerSection?.title || directSection?.title || managerSection?.title || "Unknown Section"

                        allQuestions.set(questionKey, {
                          questionText: questionText,
                          selfScore: 0,
                          othersScore: Math.round(weightedScore * 10) / 10,
                          sectionTitle: sectionTitle,
                        })
                      } else {
                        const existing = allQuestions.get(questionKey)!
                        existing.othersScore = Math.round(weightedScore * 10) / 10
                      }
                    })
                  })
                }

                // Convert to array and group by section
                const questionsBySection = new Map<
                  string,
                  typeof allQuestions extends Map<any, infer T> ? T[] : never
                >()

                Array.from(allQuestions.values()).forEach((question) => {
                  if (!questionsBySection.has(question.sectionTitle)) {
                    questionsBySection.set(question.sectionTitle, [])
                  }
                  questionsBySection.get(question.sectionTitle)!.push(question)
                })

                return Array.from(questionsBySection.entries()).map(([sectionTitle, questions]) => (
                  <div key={sectionTitle} className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">{sectionTitle}</h3>
                    <div className="space-y-6">
                      {questions.map((question, index) => (
                        <div key={`${sectionTitle}-${index}`} className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-700">{question.questionText}</h4>

                          <div className="space-y-2">
                            {/* Others Score Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Others' Assessment</span>
                                <span className="text-sm font-semibold text-gray-800">
                                  {question.othersScore.toFixed(1)}
                                </span>
                              </div>
                              <div className="relative">
                                <div className="h-6 bg-gray-200 rounded-md overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                    style={{ width: `${(question.othersScore / 5) * 100}%` }}
                                  >
                                    {question.othersScore > 1.5 && question.othersScore.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Self Score Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Self Assessment</span>
                                <span className="text-sm font-semibold text-gray-800">
                                  {question.selfScore.toFixed(1)}
                                </span>
                              </div>
                              <div className="relative">
                                <div className="h-6 bg-gray-200 rounded-md overflow-hidden">
                                  <div
                                    className="h-full bg-gray-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                    style={{ width: `${(question.selfScore / 5) * 100}%` }}
                                  >
                                    {question.selfScore > 1.5 && question.selfScore.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Difference indicator */}
                          <div className="text-xs text-center">
                            {Math.abs(question.othersScore - question.selfScore) > 0.5 && (
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs ${
                                  question.othersScore > question.selfScore
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {question.othersScore > question.selfScore
                                  ? `Others rate +${(question.othersScore - question.selfScore).toFixed(1)} higher`
                                  : `Self rates +${(question.selfScore - question.othersScore).toFixed(1)} higher`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  // Comments component
  const CommentsContent = () => {
    // Collect comments by type with proper separation
    const feedbackProviderComments = [
      ...(submission.peerComments || []),
      ...(submission.directComments || []),
      ...(submission.managerComments || []),
    ].filter((comment) => comment && comment.trim() !== "")

    const selfFeedbackComments = (submission.selfComments || []).filter((comment) => comment && comment.trim() !== "")

    const hasFeedbackProviders = feedbackProviderComments.length > 0
    const hasSelfFeedback = selfFeedbackComments.length > 0

    if (!hasFeedbackProviders && !hasSelfFeedback) {
      return (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No feedback available for {submission.managerName}.</p>
            <p className="text-sm mt-2">Feedback will appear here when survey respondents provide comments.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {/* Feedback Providers Section */}
        {hasFeedbackProviders && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Feedback Providers
              </CardTitle>
              <p className="text-sm text-gray-600">Comments from peer, direct report, and manager assessments</p>
            </CardHeader>
            <CardContent className="divide-y">
              {feedbackProviderComments.map((comment, index) => (
                <div key={index} className="py-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Feedback Provider #{index + 1}</p>
                      <div className="text-gray-800 bg-gray-50 p-3 rounded-lg">{comment}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Self Feedback Section */}
        {hasSelfFeedback && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Self Feedback
              </CardTitle>
              <p className="text-sm text-gray-600">Comments from self-assessment</p>
            </CardHeader>
            <CardContent className="divide-y">
              {selfFeedbackComments.map((comment, index) => (
                <div key={index} className="py-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Self Assessment #{index + 1}</p>
                      <div className="text-gray-800 bg-gray-50 p-3 rounded-lg">{comment}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Response Analytics selector component
  const ResponseAnalyticsSelector = () => {
    const analyticsOptions = [
      {
        key: "peer",
        name: "Peer & Colleague Assessment",
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      },
      {
        key: "direct",
        name: "Direct Report Assessment",
        icon: UserCheck,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      {
        key: "manager",
        name: "Manager Assessment",
        icon: UserCog,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      },
      {
        key: "self",
        name: "Self Assessment",
        icon: User,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
    ]

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose Assessment Type to Analyze</CardTitle>
            <p className="text-sm text-gray-600">
              Select an assessment type to view detailed analytics and performance scores.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedAnalyticsView === option.key
                const count = submission.surveyTypeCounts?.[option.key as keyof typeof submission.surveyTypeCounts] || 0

                return (
                  <Card
                    key={option.key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? `${option.borderColor} border-2 ${option.bgColor}`
                        : "border border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedAnalyticsView(option.key as any)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-6 w-6 ${option.color}`} />
                          <div>
                            <h3 className="font-medium text-sm">{option.name}</h3>
                            <p className="text-xs text-gray-500">
                              {count} submission{count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`w-3 h-3 rounded-full ${option.color.replace("text-", "bg-")}`}></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Show selected analytics */}
        {selectedAnalyticsView === "peer" && (
          <AnalyticsContent
            sections={submission.peerSections}
            surveyType="employee" // Use employee type for third-person questions
            surveyTypeName="Peer & Colleague"
            icon={Users}
            color="text-purple-600"
            count={submission.surveyTypeCounts?.peer || 0}
          />
        )}

        {selectedAnalyticsView === "direct" && (
          <AnalyticsContent
            sections={submission.directSections}
            surveyType="employee" // Use employee type for third-person questions
            surveyTypeName="Direct Report"
            icon={UserCheck}
            color="text-green-600"
            count={submission.surveyTypeCounts?.direct || 0}
          />
        )}

        {selectedAnalyticsView === "manager" && (
          <AnalyticsContent
            sections={submission.managerSections}
            surveyType="employee" // Use employee type for third-person questions
            surveyTypeName="Manager"
            icon={UserCog}
            color="text-orange-600"
            count={submission.surveyTypeCounts?.manager || 0}
          />
        )}

        {selectedAnalyticsView === "self" && (
          <AnalyticsContent
            sections={submission.selfSections}
            surveyType="supervisor" // Use supervisor type for first-person questions
            surveyTypeName="Self"
            icon={User}
            color="text-blue-600"
            count={submission.surveyTypeCounts?.self || 0}
          />
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Survey Overview - {submission.managerName}</DialogTitle>
            <div className="flex items-center gap-2">{getStatusBadge(submission.status)}</div>
          </div>
          <div className="text-sm text-gray-600">
            Latest submission: {submission.submittedAt.toLocaleDateString()} at{" "}
            {submission.submittedAt.toLocaleTimeString()}
            {submission.lastModified && (
              <span className="ml-4">Last modified: {submission.lastModified.toLocaleDateString()}</span>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="feedback-providers">
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback & Comments
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="response-analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Response Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="responses" className="space-y-6">
            {submission.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="text-sm text-gray-600">
                    How often does {submission.managerName} practice the following behaviors related to {section.title}?
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.questions.map((question, questionIndex) => {
                    const totalResponses = Object.values(question.responses).reduce((sum, count) => sum + count, 0)
                    const maxResponse = Math.max(...Object.values(question.responses))
                    // Get the actual question text from survey data - always use third person format for responses tab
                    const actualQuestionText =
                      getQuestionText(section.id, question.questionId, "employee") || question.questionText

                    return (
                      <div key={question.questionId} className="space-y-3">
                        <h4 className="font-medium text-sm">{actualQuestionText}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {LIKERT_OPTIONS.map((option) => {
                            const count = question.responses[option.value as keyof typeof question.responses]
                            const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : "0"
                            const isHighest = count === maxResponse && count > 0

                            return (
                              <div
                                key={option.value}
                                className={`p-3 rounded-lg border-2 ${
                                  isHighest ? "border-blue-500 bg-blue-50" : "border-gray-200"
                                }`}
                              >
                                <div className="text-center">
                                  <div
                                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${option.color}`}
                                  >
                                    {option.label}
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                                    <div className="text-xs text-gray-500">{percentage}%</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          Total responses: {totalResponses} / {submission.employeeCount}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="feedback-providers" className="space-y-6">
            <CommentsContent />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <ComparisonContent />
          </TabsContent>

          <TabsContent value="response-analytics" className="space-y-6">
            <ResponseAnalyticsSelector />
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
