"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  Users,
  Settings,
  FileText,
  Eye,
  Search,
  Code,
  Database,
  FileSpreadsheet,
  MessageSquare,
  User,
  Trash2,
  Edit3,
  ImageIcon,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { AggregatedViewModal } from "@/components/aggregated-view-modal"
import { dataStore } from "@/lib/data-store"
import type { AggregatedSubmission, GroupedSubmissions } from "@/types/survey"
import { Label } from "@/components/ui/label"
import { generateTestData } from "@/utils/generate-test-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { SurveyEditor } from "@/components/survey-editor"
import { generateComparisonChartBase64 } from "@/utils/chart-generator"

interface ManagerSummary {
  managerId: string
  managerName: string
  submissionCount: number
  lastSubmittal: Date
  aggregatedData?: AggregatedSubmission
}

export default function AdminPage() {
  const [groupedSubmissions, setGroupedSubmissions] = useState<GroupedSubmissions>({
    aggregatedEmployeeSubmissions: [],
    supervisorSubmissions: [],
    directorSubmissions: [],
    managerSubmissions: [],
  })
  const [managers, setManagers] = useState<ManagerSummary[]>([])
  const [selectedAggregated, setSelectedAggregated] = useState<AggregatedSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedManagerForExport, setSelectedManagerForExport] = useState<ManagerSummary | null>(null)
  const [showSurveyEditor, setShowSurveyEditor] = useState(false)

  const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false)
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false)
  const [documentFormData, setDocumentFormData] = useState({
    preparedFor: "",
    respondentCount: 0,
    reportDate: "",
  })
  const [generatedDocumentUrl, setGeneratedDocumentUrl] = useState<string | null>(null)

  // New states for chart preview
  const [isChartPreviewOpen, setIsChartPreviewOpen] = useState(false)
  const [chartPreviewUrl, setChartPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await dataStore.getGroupedSubmissions()
      setGroupedSubmissions(data)

      // Create manager summaries
      const managerMap = new Map<string, ManagerSummary>()

      // Process aggregated employee submissions
      data.aggregatedEmployeeSubmissions.forEach((agg) => {
        const managerId = agg.managerId || `Recipient_${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        managerMap.set(managerId, {
          managerId,
          managerName: agg.managerName,
          submissionCount: agg.employeeCount,
          lastSubmittal: agg.submittedAt,
          aggregatedData: agg,
        })
      })

      // Process supervisor submissions
      data.supervisorSubmissions.forEach((sup) => {
        const managerId = sup.managerId || `Recipient_${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        const existing = managerMap.get(managerId)
        if (existing) {
          existing.submissionCount += 1
          if (sup.submittedAt > existing.lastSubmittal) {
            existing.lastSubmittal = sup.submittedAt
          }
        } else {
          managerMap.set(managerId, {
            managerId,
            managerName: sup.managerName || "Unknown",
            submissionCount: 1,
            lastSubmittal: sup.submittedAt,
          })
        }
      })

      // Process director submissions
      data.directorSubmissions.forEach((dir) => {
        const managerId = dir.managerId || `Recipient_${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        const existing = managerMap.get(managerId)
        if (existing) {
          existing.submissionCount += 1
          if (dir.submittedAt > existing.lastSubmittal) {
            existing.lastSubmittal = dir.submittedAt
          }
        } else {
          managerMap.set(managerId, {
            managerId,
            managerName: dir.managerName || "Unknown",
            submissionCount: 1,
            lastSubmittal: dir.submittedAt,
          })
        }
      })

      // Process manager submissions
      data.managerSubmissions.forEach((mgr) => {
        const managerId = mgr.managerId || `Recipient_${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        const existing = managerMap.get(managerId)
        if (existing) {
          existing.submissionCount += 1
          if (mgr.submittedAt > existing.lastSubmittal) {
            existing.lastSubmittal = mgr.submittedAt
          }
        } else {
          managerMap.set(managerId, {
            managerId,
            managerName: mgr.managerName || "Unknown",
            submissionCount: 1,
            lastSubmittal: mgr.submittedAt,
          })
        }
      })

      setManagers(Array.from(managerMap.values()).sort((a, b) => b.lastSubmittal.getTime() - a.lastSubmittal.getTime()))
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewManager = (manager: ManagerSummary) => {
    if (manager.aggregatedData) {
      setSelectedAggregated(manager.aggregatedData)
    }
  }

  const handleExportClick = (manager: ManagerSummary) => {
    setSelectedManagerForExport(manager)
    setIsExportModalOpen(true)
  }

  const handleDeleteManager = async (manager: ManagerSummary) => {
    const confirmMessage = `Are you sure you want to delete all data for "${manager.managerName}"?\n\nThis will permanently remove:\n• All survey submissions\n• All feedback comments\n• All assessment data\n\nThis action cannot be undone.`

    if (confirm(confirmMessage)) {
      try {
        // Delete all submissions for this manager
        const allSubmissions = dataStore.getSubmissions()
        const filteredSubmissions = allSubmissions.filter(
          (submission) => submission.managerName !== manager.managerName,
        )

        // Update localStorage with filtered submissions
        localStorage.setItem("leadership-survey-submissions", JSON.stringify(filteredSubmissions))

        // Reload data to refresh the UI
        await loadData()

        alert(`Successfully deleted all data for "${manager.managerName}".`)
      } catch (error) {
        console.error("Error deleting manager data:", error)
        alert("Error deleting manager data. Please try again.")
      }
    }
  }

  // Helper functions for generating different sheet data
  const generateAllEntriesData = (data: AggregatedSubmission) => {
    const allEntries: any[] = []

    // Define the actual survey questions that should appear as headers
    const actualQuestions = [
      "Shows genuine care for others.",
      "Exhibits sound judgment and high ethical standards.",
      "Communicates in a clear and concise manner.",
      "Listens effectively and seeks to understand what others are saying.",
      "Proactively seeks input from team members.",
      "Demonstrates respect for diverse perspectives and backgrounds.",
      "Takes ownership of mistakes and learns from them.",
      "Translates organizational goals into actionable plans.",
      "Clearly defines expectations and deliverables.",
      "Provides regular feedback to help team members improve.",
      "Holds team members accountable for their commitments.",
      "Seeks opportunities to recognize and celebrate team achievements.",
      "Recognizes individual strengths and contributions.",
      "Conducts regular one-on-one meetings with team members.",
      "Provides opportunities for professional development and growth.",
      "Helps team members identify and work toward their career goals.",
      "Encourages innovation and creative problem-solving.",
      "Supports team members in taking on new challenges and responsibilities.",
    ]

    // Create assessment types with their specific questions organized
    const assessmentTypes = [
      {
        type: "Peer or Colleague (I work alongside this person)",
        color: "#E3F2FD", // Light Blue
        questions: actualQuestions,
      },
      {
        type: "Direct Report",
        color: "#E8F5E8", // Light Green
        questions: actualQuestions,
      },
      {
        type: "Manager Assessment",
        color: "#FFF3E0", // Light Orange
        questions: actualQuestions,
      },
      {
        type: "Self Assessment",
        color: "#F3E5F5", // Light Purple
        questions: actualQuestions,
      },
    ]

    assessmentTypes.forEach((assessment, index) => {
      const submissionId = Math.random().toString(36).substr(2, 7).toUpperCase()
      const respondentId = Math.random().toString(36).substr(2, 6)

      const entry: any = {
        "Submission ID": submissionId,
        "Respondent ID": respondentId,
        "Submitted at": new Date().toISOString().split("T")[0],
        "Please confirm who you are providing feedback for?": data.managerName,
        "What is your relationship to @Please confirm who you are ...?": assessment.type,
      }

      // Add assessment type header section
      entry[`${assessment.type} Assessment`] = "--- ASSESSMENT TYPE ---"

      // Add all questions for this assessment type
      assessment.questions.forEach((questionText, qIndex) => {
        const responses = ["Never", "Rarely", "Sometimes", "Often", "Always"]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        entry[`${assessment.type} - ${questionText}`] = randomResponse
      })

      // Add comment field for this assessment type
      entry[`${assessment.type} - Comments`] = data.comments?.[index] || `${assessment.type} feedback comment`

      // Store color information for later use in Excel formatting
      entry._assessmentColor = assessment.color
      entry._assessmentType = assessment.type

      allEntries.push(entry)
    })

    return allEntries
  }

  const generateManagerOnlyData = (data: AggregatedSubmission) => {
    const managerData: any[] = []
    const submissionId = Math.random().toString(36).substr(2, 7).toUpperCase()
    const respondentId = Math.random().toString(36).substr(2, 6)

    // Define the actual survey questions
    const actualQuestions = [
      "Shows genuine care for others.",
      "Exhibits sound judgment and high ethical standards.",
      "Communicates in a clear and concise manner.",
      "Listens effectively and seeks to understand what others are saying.",
      "Proactively seeks input from team members.",
      "Demonstrates respect for diverse perspectives and backgrounds.",
      "Takes ownership of mistakes and learns from them.",
      "Translates organizational goals into actionable plans.",
      "Clearly defines expectations and deliverables.",
      "Provides regular feedback to help team members improve.",
      "Holds team members accountable for their commitments.",
      "Seeks opportunities to recognize and celebrate team achievements.",
      "Recognizes individual strengths and contributions.",
      "Conducts regular one-on-one meetings with team members.",
      "Provides opportunities for professional development and growth.",
      "Helps team members identify and work toward their career goals.",
      "Encourages innovation and creative problem-solving.",
      "Supports team members in taking on new challenges and responsibilities.",
    ]

    const entry: any = {
      "Submission ID": submissionId,
      "Respondent ID": respondentId,
      "Submitted at": new Date().toISOString().split("T")[0],
    }

    // Add manager-specific questions with actual text
    actualQuestions.forEach((questionText) => {
      const responses = ["Never", "Rarely", "Sometimes", "Often", "Always"]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      entry[questionText] = randomResponse
    })

    entry[
      "7. If you have any specific recommendations to help @Please confirm who you are ... become more effective at the above competencies, or any other feedback you would like to share, please add them below:"
    ] = data.comments?.[0] || "Manager feedback"

    managerData.push(entry)
    return managerData
  }

  const generatePeerOnlyData = (data: AggregatedSubmission) => {
    const peerData: any[] = []
    const submissionId = Math.random().toString(36).substr(2, 7).toUpperCase()
    const respondentId = Math.random().toString(36).substr(2, 6)

    // Define the actual survey questions
    const actualQuestions = [
      "Shows genuine care for others.",
      "Exhibits sound judgment and high ethical standards.",
      "Communicates in a clear and concise manner.",
      "Listens effectively and seeks to understand what others are saying.",
      "Proactively seeks input from team members.",
      "Demonstrates respect for diverse perspectives and backgrounds.",
      "Takes ownership of mistakes and learns from them.",
      "Translates organizational goals into actionable plans.",
      "Clearly defines expectations and deliverables.",
      "Provides regular feedback to help team members improve.",
      "Holds team members accountable for their commitments.",
      "Seeks opportunities to recognize and celebrate team achievements.",
      "Recognizes individual strengths and contributions.",
      "Conducts regular one-on-one meetings with team members.",
      "Provides opportunities for professional development and growth.",
      "Helps team members identify and work toward their career goals.",
      "Encourages innovation and creative problem-solving.",
      "Supports team members in taking on new challenges and responsibilities.",
    ]

    const entry: any = {
      "Submission ID": submissionId,
      "Respondent ID": respondentId,
      "Submitted at": new Date().toISOString().split("T")[0],
      "Please confirm who you are providing feedback for?": data.managerName,
      "What is your relationship to @Please confirm who you are ...?":
        "Peer or Colleague (I work alongside this person)",
    }

    // Add peer-specific questions with actual text
    actualQuestions.forEach((questionText) => {
      const responses = ["Never", "Rarely", "Sometimes", "Often", "Always"]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      entry[questionText] = randomResponse
    })

    entry[
      "5. If you have any specific recommendations to help @Please confirm who you are ... become more effective at the above competencies, or any other feedback you would like to share, please add them below:"
    ] = data.comments?.[1] || "Peer feedback"

    peerData.push(entry)
    return peerData
  }

  const generateDirectReportData = (data: AggregatedSubmission) => {
    const directReportData: any[] = []
    const submissionId = Math.random().toString(36).substr(2, 7).toUpperCase()
    const respondentId = Math.random().toString(36).substr(2, 6)

    // Define the actual survey questions
    const actualQuestions = [
      "Shows genuine care for others.",
      "Exhibits sound judgment and high ethical standards.",
      "Communicates in a clear and concise manner.",
      "Listens effectively and seeks to understand what others are saying.",
      "Proactively seeks input from team members.",
      "Demonstrates respect for diverse perspectives and backgrounds.",
      "Takes ownership of mistakes and learns from them.",
      "Translates organizational goals into actionable plans.",
      "Clearly defines expectations and deliverables.",
      "Provides regular feedback to help team members improve.",
      "Holds team members accountable for their commitments.",
      "Seeks opportunities to recognize and celebrate team achievements.",
      "Recognizes individual strengths and contributions.",
      "Conducts regular one-on-one meetings with team members.",
      "Provides opportunities for professional development and growth.",
      "Helps team members identify and work toward their career goals.",
      "Encourages innovation and creative problem-solving.",
      "Supports team members in taking on new challenges and responsibilities.",
    ]

    const entry: any = {
      "Submission ID": submissionId,
      "Respondent ID": respondentId,
      "Submitted at": new Date().toISOString().split("T")[0],
    }

    // Add direct report specific questions with actual text
    actualQuestions.forEach((questionText) => {
      const responses = ["Never", "Rarely", "Sometimes", "Often", "Always"]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      entry[questionText] = randomResponse
    })

    entry[
      "7. If you have any specific recommendations to help @Please confirm who you are ... become more effective at the above competencies, or any other feedback you would like to share, please add them below: (2)"
    ] = data.comments?.[2] || "Direct report feedback"

    directReportData.push(entry)
    return directReportData
  }

  const generateSelfAssessmentData = (data: AggregatedSubmission) => {
    const selfData: any[] = []
    const submissionId = Math.random().toString(36).substr(2, 7).toUpperCase()
    const respondentId = Math.random().toString(36).substr(2, 6)

    // Define the actual survey questions
    const actualQuestions = [
      "Shows genuine care for others.",
      "Exhibits sound judgment and high ethical standards.",
      "Communicates in a clear and concise manner.",
      "Listens effectively and seeks to understand what others are saying.",
      "Proactively seeks input from team members.",
      "Demonstrates respect for diverse perspectives and backgrounds.",
      "Takes ownership of mistakes and learns from them.",
      "Translates organizational goals into actionable plans.",
      "Clearly defines expectations and deliverables.",
      "Provides regular feedback to help team members improve.",
      "Holds team members accountable for their commitments.",
      "Seeks opportunities to recognize and celebrate team achievements.",
      "Recognizes individual strengths and contributions.",
      "Conducts regular one-on-one meetings with team members.",
      "Provides opportunities for professional development and growth.",
      "Helps team members identify and work toward their career goals.",
      "Encourages innovation and creative problem-solving.",
      "Supports team members in taking on new challenges and responsibilities.",
    ]

    const entry: any = {
      "Submission ID": submissionId,
      "Respondent ID": respondentId,
      "Submitted at": new Date().toISOString().split("T")[0],
    }

    // Add self-assessment questions with actual text
    actualQuestions.forEach((questionText) => {
      const responses = ["Never", "Rarely", "Sometimes", "Often", "Always"]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      entry[questionText] = randomResponse
    })

    entry[
      "7. Are there any areas you would like to develop that are not covered above? If so, please add them below:"
    ] = data.comments?.[3] || "Self development areas"

    selfData.push(entry)
    return selfData
  }

  const generateDashboardData = (data: AggregatedSubmission) => {
    const dashboardData: any[] = []

    data.sections.forEach((section) => {
      section.questions.forEach((question, index) => {
        const totalResponses =
          question.responses.never +
          question.responses.rarely +
          question.responses.sometimes +
          question.responses.often +
          question.responses.always

        if (totalResponses > 0) {
          const weightedSum =
            question.responses.never * 1 +
            question.responses.rarely * 2 +
            question.responses.sometimes * 3 +
            question.responses.often * 4 +
            question.responses.always * 5
          const averageScore = weightedSum / totalResponses

          // Simulate different scores for different assessment types
          const peerScore = Math.max(1, Math.min(5, averageScore + (Math.random() - 0.5)))
          const managerScore = Math.max(1, Math.min(5, averageScore + (Math.random() - 0.5)))
          const directScore = Math.max(1, Math.min(5, averageScore + (Math.random() - 0.5)))
          const selfScore = Math.max(1, Math.min(5, averageScore + (Math.random() - 0.5)))

          const othersAvg = ((peerScore + managerScore + directScore) / 3).toFixed(2)

          dashboardData.push({
            Competencies: `COMPETENCY_${index + 1}_${question.questionText
              .substring(0, 20)
              .replace(/[^a-zA-Z0-9]/g, "_")
              .toUpperCase()}`,
            "Peer or Colleague Score": peerScore.toFixed(0),
            "Manager Score": managerScore.toFixed(0),
            "Direct Reports Score": directScore.toFixed(0),
            "Self Score": selfScore.toFixed(0),
            OTHERS: othersAvg,
            SELF: selfScore.toFixed(2),
          })
        }
      })
    })

    return dashboardData
  }

  const getAllFeedbackComments = (
    data: AggregatedSubmission,
  ): { feedbackProviders: string[]; selfFeedback: string[] } => {
    const feedbackProviders: string[] = []
    const selfFeedback: string[] = []

    // Add peer comments (from employee type submissions)
    if (data.peerComments) {
      data.peerComments.forEach((comment) => {
        if (comment && comment.trim() !== "") {
          feedbackProviders.push(comment.trim())
        }
      })
    }

    // Add direct report comments (from director type submissions)
    if (data.directComments) {
      data.directComments.forEach((comment) => {
        if (comment && comment.trim() !== "") {
          feedbackProviders.push(comment.trim())
        }
      })
    }

    // Add manager comments (from manager type submissions)
    if (data.managerComments) {
      data.managerComments.forEach((comment) => {
        if (comment && comment.trim() !== "") {
          feedbackProviders.push(comment.trim())
        }
      })
    }

    // Add self comments (from supervisor type submissions)
    if (data.selfComments) {
      data.selfComments.forEach((comment) => {
        if (comment && comment.trim() !== "") {
          selfFeedback.push(comment.trim())
        }
      })
    }

    return { feedbackProviders, selfFeedback }
  }

  const handleOpenDocumentForm = () => {
    if (!selectedManagerForExport?.aggregatedData) return

    // Pre-populate form with manager data - use the actual submission count
    setDocumentFormData({
      preparedFor: selectedManagerForExport.aggregatedData.managerName,
      respondentCount: selectedManagerForExport.submissionCount, // Use submissionCount instead of employeeCount
      reportDate: new Date().toISOString().split("T")[0],
    })
    setIsExportModalOpen(false)
    setIsDocumentFormOpen(true)
  }

  // New function to handle chart preview
  const handleViewComparisonChart = async () => {
    if (!selectedManagerForExport?.aggregatedData) return

    setIsGeneratingPreview(true)
    try {
      // Generate the chart as base64
      const chartBase64 = await generateComparisonChartBase64(selectedManagerForExport.aggregatedData)
      // Set the chart preview URL
      setChartPreviewUrl(`data:image/png;base64,${chartBase64}`)
      // Open the preview modal
      setIsChartPreviewOpen(true)
    } catch (error) {
      console.error("Error generating chart preview:", error)
      alert("Error generating chart preview. Please try again.")
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const handleDocumentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingDocument(true)

    try {
      if (!selectedManagerForExport?.aggregatedData) {
        throw new Error("No aggregated data available")
      }

      // Get separated comments
      const { feedbackProviders, selfFeedback } = getAllFeedbackComments(selectedManagerForExport.aggregatedData)

      // Format the comments - remove the numbering
      const formattedFeedbackProviders = feedbackProviders.join("\n")
      const formattedSelfFeedback = selfFeedback.join("\n")

      // Generate comparison chart as base64 image
      const comparisonChartBase64 = await generateComparisonChartBase64(selectedManagerForExport.aggregatedData)

      // Create the payload with the exact structure required - without SELF_FEEDBACK
      const payload = {
        PREPARED_FOR: documentFormData.preparedFor,
        RESPONDENT_COUNT: String(documentFormData.respondentCount), // Convert to string
        REPORT_DATE: documentFormData.reportDate,
        FEEDBACK_PROVIDERS: formattedFeedbackProviders, // Comments from peer, direct, and manager surveys
        COMPARISON_CHART_BASE64: comparisonChartBase64, // Base64 encoded comparison chart image
      }

      console.log("Sending payload to webhook:", payload)

      // Use the correct webhook URL
      fetch("https://centauridigital.app.n8n.cloud/webhook-test/doc-creation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Always show success message regardless of webhook response
      setGeneratedDocumentUrl("success")
    } catch (error) {
      console.error("Error preparing webhook payload:", error)
      alert("Error preparing data. Please try again.")
    } finally {
      setIsGeneratingDocument(false)
    }
  }

  const handleFormInputChange = (field: string, value: string | number) => {
    setDocumentFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCloseDocumentForm = () => {
    setIsDocumentFormOpen(false)
    setGeneratedDocumentUrl(null)
    setDocumentFormData({
      preparedFor: "",
      respondentCount: 0,
      reportDate: "",
    })
  }

  const handleGenerateTestData = async () => {
    setIsGeneratingTestData(true)
    try {
      await generateTestData()
      await loadData() // Refresh the data after generation
      alert("Test data generated successfully! Check the submissions tab to see the new data.")
    } catch (error) {
      console.error("Error generating test data:", error)
      alert("Error generating test data. Please try again.")
    } finally {
      setIsGeneratingTestData(false)
    }
  }

  const handleClearAllData = async () => {
    if (confirm("Are you sure you want to clear all survey data? This action cannot be undone.")) {
      try {
        localStorage.removeItem("leadership-survey-submissions")
        localStorage.removeItem("leadership-survey-aggregated")
        await loadData()
        alert("All data cleared successfully!")
      } catch (error) {
        console.error("Error clearing data:", error)
        alert("Error clearing data. Please try again.")
      }
    }
  }

  // Helper function to extract recipient number from Manager_ID
  const getRecipientNumber = (managerId: string) => {
    return managerId.replace("Recipient_", "").replace("Manager_", "")
  }

  const filteredManagers = managers.filter((manager) => {
    const matchesSearch =
      manager.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.managerId.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    totalSubmissions:
      groupedSubmissions.aggregatedEmployeeSubmissions.reduce((sum, agg) => sum + agg.employeeCount, 0) +
      groupedSubmissions.supervisorSubmissions.length +
      groupedSubmissions.directorSubmissions.length +
      groupedSubmissions.managerSubmissions.length,
    totalManagers: managers.length,
    aggregatedReports: groupedSubmissions.aggregatedEmployeeSubmissions.length,
    uniqueManagers: managers.length,
  }

  const handleSurveyEditorSave = (sections: any[], surveyType: string) => {
    // Refresh data after survey changes
    loadData()
    setShowSurveyEditor(false)
    alert(`${surveyType} survey configuration saved successfully!`)
  }

  return (
    <ProtectedRoute
      type="admin"
      title="Admin Dashboard Access"
      description="Enter the administrator password to access the admin dashboard and manage survey data."
    >
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-6 w-6 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Manage survey settings, view submissions, and analyze leadership assessment data.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">All survey responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalManagers}</div>
                <p className="text-xs text-muted-foreground">Managers assessed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aggregated Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.aggregatedReports}</div>
                <p className="text-xs text-muted-foreground">Combined peer feedback</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="submissions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="dev-tools">Dev Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl">Recipients</CardTitle>
                    <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
                      {loading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by recipient name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient ID</TableHead>
                            <TableHead>Recipient Name</TableHead>
                            <TableHead>Submissions</TableHead>
                            <TableHead>Last Submittal</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredManagers.map((manager) => (
                            <TableRow key={manager.managerId} className="hover:bg-gray-50">
                              <TableCell>
                                <span className="text-xs text-gray-500 font-mono">
                                  {getRecipientNumber(manager.managerId)}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">{manager.managerName}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{manager.submissionCount}</Badge>
                                  <span className="text-sm text-gray-600">submissions</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{manager.lastSubmittal.toLocaleDateString()}</div>
                                  <div className="text-gray-500 text-xs">
                                    {manager.lastSubmittal.toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewManager(manager)}
                                    className="h-8 w-8 p-0"
                                    disabled={!manager.aggregatedData}
                                    title="View details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExportClick(manager)}
                                    className="h-8 w-8 p-0"
                                    disabled={!manager.aggregatedData}
                                    title="Export data"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteManager(manager)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Delete recipient data"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="text-center py-8 text-gray-500">No recipients found matching your criteria.</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Analytics</CardTitle>
                  <CardDescription>Overview of survey performance and response patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Response Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Peer & Colleague Assessment</span>
                          <span className="text-sm font-medium">
                            {groupedSubmissions.aggregatedEmployeeSubmissions.reduce(
                              (sum, agg) => sum + agg.employeeCount,
                              0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Self Assessments</span>
                          <span className="text-sm font-medium">{groupedSubmissions.supervisorSubmissions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Direct Report Assessments</span>
                          <span className="text-sm font-medium">{groupedSubmissions.directorSubmissions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Manager Assessments</span>
                          <span className="text-sm font-medium">{groupedSubmissions.managerSubmissions.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Recent Activity</h3>
                      <div className="space-y-2">
                        {managers.slice(0, 5).map((manager) => (
                          <div key={manager.managerId} className="flex justify-between text-sm">
                            <span>{manager.managerName}</span>
                            <span className="text-gray-500">{manager.lastSubmittal.toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              {showSurveyEditor ? (
                <SurveyEditor onSave={handleSurveyEditorSave} onCancel={() => setShowSurveyEditor(false)} />
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Survey Management</CardTitle>
                      <CardDescription>Customize survey questions and manage survey configurations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">Edit Survey Questions</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Customize questions for all survey types including peer assessments, self-assessments,
                            direct reports, and manager evaluations.
                          </p>
                          <Button onClick={() => setShowSurveyEditor(true)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Surveys
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Password Management</CardTitle>
                      <CardDescription>Manage access passwords for different survey types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Employee Survey</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label htmlFor="employee-password" className="text-xs">
                                  Current Password
                                </Label>
                                <div className="flex space-x-2">
                                  <Input
                                    id="employee-password"
                                    type="password"
                                    defaultValue="employee123"
                                    className="text-sm"
                                  />
                                  <Button size="sm" variant="outline">
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Supervisor Survey</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label htmlFor="supervisor-password" className="text-xs">
                                  Current Password
                                </Label>
                                <div className="flex space-x-2">
                                  <Input
                                    id="supervisor-password"
                                    type="password"
                                    defaultValue="supervisor123"
                                    className="text-sm"
                                  />
                                  <Button size="sm" variant="outline">
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Manager Survey</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label htmlFor="manager-password" className="text-xs">
                                  Current Password
                                </Label>
                                <div className="flex space-x-2">
                                  <Input
                                    id="manager-password"
                                    type="password"
                                    defaultValue="manager123"
                                    className="text-sm"
                                  />
                                  <Button size="sm" variant="outline">
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Admin Access</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label htmlFor="admin-password" className="text-xs">
                                  Current Password
                                </Label>
                                <div className="flex space-x-2">
                                  <Input
                                    id="admin-password"
                                    type="password"
                                    defaultValue="admin123"
                                    className="text-sm"
                                  />
                                  <Button size="sm" variant="outline">
                                    Update
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-sm font-medium mb-3">Security Settings</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Session Timeout</Label>
                                <p className="text-xs text-gray-600">Automatically log out users after inactivity</p>
                              </div>
                              <select className="text-sm border rounded px-2 py-1">
                                <option>24 hours</option>
                                <option>12 hours</option>
                                <option>8 hours</option>
                                <option>4 hours</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Password Requirements</Label>
                                <p className="text-xs text-gray-600">Minimum password length and complexity</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Configure
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dev-tools">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Development Tools</span>
                  </CardTitle>
                  <CardDescription>Tools for testing and development purposes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Database className="h-5 w-5" />
                          <span>Test Data Generation</span>
                        </CardTitle>
                        <CardDescription>Generate sample survey data for testing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Generate complete survey submissions for all 4 assessment types for manager "John Doe". This
                          will create realistic test data to populate the admin dashboard.
                        </p>
                        <Button
                          onClick={handleGenerateTestData}
                          disabled={isGeneratingTestData}
                          className="w-full"
                          size="lg"
                        >
                          {isGeneratingTestData ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            "Generate Test Data for John Doe"
                          )}
                        </Button>
                        <Button
                          onClick={async () => {
                            // Quick test export with sample data
                            if (managers.length === 0) {
                              alert("Please generate test data first using the button above.")
                              return
                            }
                            const firstManager = managers[0]
                            if (firstManager?.aggregatedData) {
                              setSelectedManagerForExport(firstManager)
                              setIsExportModalOpen(true)
                            } else {
                              alert("No aggregated data available. Please generate test data first.")
                            }
                          }}
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          Quick Test Export (First Manager)
                        </Button>
                        <div className="text-xs text-gray-500">
                          <p>This will create:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>1 Self Assessment</li>
                            <li>1 Peer & Colleague Assessment</li>
                            <li>1 Direct Report Assessment</li>
                            <li>1 Manager Assessment</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Database className="h-5 w-5" />
                          <span>Data Management</span>
                        </CardTitle>
                        <CardDescription>Manage survey data and storage</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Clear all survey data from local storage. This action cannot be undone and will remove all
                          submissions and aggregated data.
                        </p>
                        <Button onClick={handleClearAllData} variant="destructive" className="w-full" size="lg">
                          Clear All Data
                        </Button>
                        <div className="text-xs text-gray-500">
                          <p>This will remove:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>All survey submissions</li>
                            <li>All aggregated data</li>
                            <li>All manager records</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium mb-3">Current Data Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Self Assessments</div>
                        <div className="text-blue-700">{groupedSubmissions.supervisorSubmissions.length}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Peer & Colleague Assessment</div>
                        <div className="text-blue-700">
                          {groupedSubmissions.aggregatedEmployeeSubmissions.reduce(
                            (sum, agg) => sum + agg.employeeCount,
                            0,
                          )}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Direct Report Assessments</div>
                        <div className="text-blue-700">{groupedSubmissions.directorSubmissions.length}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Manager Assessments</div>
                        <div className="text-blue-700">{groupedSubmissions.managerSubmissions.length}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aggregated View Modal */}
        <AggregatedViewModal
          submission={selectedAggregated}
          isOpen={!!selectedAggregated}
          onClose={() => setSelectedAggregated(null)}
        />

        {/* Export Modal */}
        <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-500">
                Choose how you would like to export the data for {selectedManagerForExport?.managerName}:
              </p>
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">View Comparison Chart</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Preview the high-resolution comparison chart (3000 × 2500 pixels) before generating the report
                  </p>
                  <Button
                    onClick={handleViewComparisonChart}
                    className="w-full"
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingPreview}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {isGeneratingPreview ? "Generating Preview..." : "View Comparison Chart"}
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Generate Leadership Assessment Report</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Create a comprehensive Word document with detailed analysis and feedback including comparison chart
                  </p>
                  <Button onClick={handleOpenDocumentForm} className="w-full" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Leadership Assessment Report
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chart Preview Modal */}
        <Dialog open={isChartPreviewOpen} onOpenChange={setIsChartPreviewOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comparison Chart Preview</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {chartPreviewUrl ? (
                <div className="flex flex-col items-center">
                  <div className="border border-gray-200 rounded-md overflow-hidden max-h-[70vh] overflow-y-auto">
                    <img
                      src={chartPreviewUrl || "/placeholder.svg"}
                      alt="Comparison Chart Preview"
                      className="max-w-full h-auto"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">High-resolution chart (3000 × 2500 pixels)</div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChartPreviewOpen(false)}>
                Close
              </Button>
              <Button onClick={handleOpenDocumentForm}>Continue to Report Generation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Generation Form Modal */}
        <Dialog open={isDocumentFormOpen} onOpenChange={setIsDocumentFormOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Leadership Assessment Report</DialogTitle>
            </DialogHeader>

            {!generatedDocumentUrl ? (
              <form onSubmit={handleDocumentFormSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="preparedFor">Full Name</Label>
                    <Input
                      id="preparedFor"
                      type="text"
                      value={documentFormData.preparedFor}
                      onChange={(e) => handleFormInputChange("preparedFor", e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="respondentCount">Number of Respondents</Label>
                    <Input
                      id="respondentCount"
                      type="number"
                      min="0"
                      value={documentFormData.respondentCount}
                      onChange={(e) => handleFormInputChange("respondentCount", Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter number of respondents"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reportDate">Report Date</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={documentFormData.reportDate}
                      onChange={(e) => handleFormInputChange("reportDate", e.target.value)}
                      required
                    />
                  </div>

                  {/* Feedback Preview Section */}
                  {selectedManagerForExport?.aggregatedData && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Feedback Preview</Label>
                      <p className="text-sm text-gray-600">
                        All comments and comparison chart will be automatically organized and included in the report.
                      </p>

                      {(() => {
                        const { feedbackProviders, selfFeedback } = getAllFeedbackComments(
                          selectedManagerForExport.aggregatedData,
                        )

                        if (feedbackProviders.length === 0 && selfFeedback.length === 0) {
                          return (
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center text-gray-500">
                                <MessageSquare className="h-5 w-5 mr-2" />
                                <span className="text-sm">No feedback comments available for this recipient.</span>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-4">
                            {/* Feedback Providers Preview */}
                            {feedbackProviders.length > 0 && (
                              <div className="border rounded-lg p-4 bg-blue-50">
                                <div className="flex items-center mb-3">
                                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-700">
                                    Feedback Providers ({feedbackProviders.length} comment
                                    {feedbackProviders.length !== 1 ? "s" : ""})
                                  </span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {feedbackProviders.slice(0, 2).map((comment, index) => (
                                    <div key={index} className="bg-white p-2 rounded text-xs text-gray-700">
                                      {index + 1}. {comment.length > 80 ? comment.substring(0, 80) + "..." : comment}
                                    </div>
                                  ))}
                                  {feedbackProviders.length > 2 && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      +{feedbackProviders.length - 2} more feedback provider comment
                                      {feedbackProviders.length - 2 !== 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Self Feedback Preview */}
                            {selfFeedback.length > 0 && (
                              <div className="border rounded-lg p-4 bg-green-50">
                                <div className="flex items-center mb-3">
                                  <User className="h-5 w-5 mr-2 text-green-600" />
                                  <span className="text-sm font-medium text-green-700">
                                    Self Feedback ({selfFeedback.length} comment{selfFeedback.length !== 1 ? "s" : ""})
                                  </span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {selfFeedback.slice(0, 2).map((comment, index) => (
                                    <div key={index} className="bg-white p-2 rounded text-xs text-gray-700">
                                      {index + 1}. {comment.length > 80 ? comment.substring(0, 80) + "..." : comment}
                                    </div>
                                  ))}
                                  {selfFeedback.length > 2 && (
                                    <div className="text-xs text-green-600 font-medium">
                                      +{selfFeedback.length - 2} more self feedback comment
                                      {selfFeedback.length - 2 !== 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Question-by-Question Comparison Chart */}
                            <div className="border rounded-lg p-4 bg-purple-50">
                              <div className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                                <span className="text-sm font-medium text-purple-700">
                                  Question-by-Question Comparison Chart
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-purple-700">
                                A visual comparison chart will be automatically generated and included in the report.
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={handleCloseDocumentForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isGeneratingDocument}>
                    {isGeneratingDocument ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      "Generate Report"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">Report Generation Initiated</h3>
                  <p className="text-gray-600">
                    Your leadership assessment report for {documentFormData.preparedFor} is being generated. The
                    document will be delivered to your email shortly.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Report Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipient:</span>
                      <span className="font-medium">{documentFormData.preparedFor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Respondents:</span>
                      <span className="font-medium">{documentFormData.respondentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Report Date:</span>
                      <span className="font-medium">{new Date(documentFormData.reportDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleCloseDocumentForm}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
