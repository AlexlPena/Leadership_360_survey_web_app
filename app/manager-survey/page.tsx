"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { SurveySection } from "@/components/survey-section"
import { Navigation } from "@/components/navigation"
import { UserCog, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { getManagerSections } from "@/lib/survey-data"
import { dataStore } from "@/lib/data-store"
import { collectSubmissionData } from "@/lib/ip-tracker"
import Link from "next/link"

export default function ManagerSurveyPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({})
  const [managerName, setManagerName] = useState("")
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [sections, setSections] = useState(getManagerSections())

  useEffect(() => {
    setSections(getManagerSections())
  }, [])

  useEffect(() => {
    // Initialize responses for all sections
    const initialResponses: Record<string, Record<string, string>> = {}
    sections.forEach((section) => {
      initialResponses[section.id] = {}
    })
    setResponses(initialResponses)
  }, [sections])

  const handleResponseChange = (sectionId: string, questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [questionId]: value,
      },
    }))
  }

  const getCurrentSectionProgress = () => {
    const currentSectionData = sections[currentSection]
    if (!currentSectionData) return 0

    const sectionResponses = responses[currentSectionData.id] || {}
    const answeredQuestions = Object.keys(sectionResponses).filter(
      (questionId) => sectionResponses[questionId] && sectionResponses[questionId].trim() !== "",
    ).length

    return (answeredQuestions / currentSectionData.questions.length) * 100
  }

  const getOverallProgress = () => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0)
    const answeredQuestions = Object.values(responses).reduce((sum, sectionResponses) => {
      return sum + Object.values(sectionResponses).filter((response) => response && response.trim() !== "").length
    }, 0)

    return (answeredQuestions / totalQuestions) * 100
  }

  const canProceedToNext = () => {
    const currentSectionData = sections[currentSection]
    if (!currentSectionData) return false

    const sectionResponses = responses[currentSectionData.id] || {}
    return currentSectionData.questions.every(
      (question) => sectionResponses[question.id] && sectionResponses[question.id].trim() !== "",
    )
  }

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSubmit = async () => {
    if (!managerName.trim()) {
      setError("Please enter the manager's name")
      return
    }

    // Validate all sections are complete
    const allComplete = sections.every((section) => {
      const sectionResponses = responses[section.id] || {}
      return section.questions.every((question) => sectionResponses[question.id])
    })

    if (!allComplete) {
      setError("Please complete all questions before submitting")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const submissionData = await collectSubmissionData()

      await dataStore.addSubmission({
        type: "manager",
        managerName: managerName.trim(),
        anonymousId: `MGR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        submittedAt: new Date(),
        status: "completed",
        responses,
        comments: comments.trim(),
        ipAddress: submissionData.ipAddress,
        userAgent: submissionData.userAgent,
        submissionLocation: submissionData.submissionLocation,
      })

      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting survey:", error)
      setError("Failed to submit survey. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <ProtectedRoute
        type="manager"
        title="Manager Assessment"
        description="Provide feedback about your manager's leadership effectiveness"
      >
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-900">Manager Assessment Complete!</CardTitle>
                  <CardDescription>
                    Thank you for providing feedback about {managerName}'s leadership effectiveness. Your responses have
                    been recorded successfully.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-6">
                    Your feedback is valuable and will help improve leadership development within the organization.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                      <Button variant="outline">Return Home</Button>
                    </Link>
                    <Link href="/admin">
                      <Button>View Admin Dashboard</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute
      type="manager"
      title="Manager Assessment"
      description="Provide feedback about your manager's leadership effectiveness"
    >
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <UserCog className="h-8 w-8 text-orange-600 mr-2" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Assessment</h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Please provide honest feedback about your manager's leadership effectiveness. Your responses will help
                  them understand their impact and identify areas for development.
                </p>
              </div>
            </div>

            {/* Manager Name Input */}
            {currentSection === 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Manager Information</CardTitle>
                  <CardDescription>Please enter your manager's name to begin the assessment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="manager-name">Manager's Name</Label>
                    <Input
                      id="manager-name"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="Enter your manager's full name"
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Section {currentSection + 1} of {sections.length}
                  </span>
                  <span className="text-sm text-gray-600">{Math.round(getOverallProgress())}% Complete</span>
                </div>
                <Progress value={getOverallProgress()} className="w-full" />
                <p className="text-xs text-gray-500 mt-1">
                  Current Section: {Math.round(getCurrentSectionProgress())}% complete
                </p>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current Section */}
            {sections[currentSection] && (
              <SurveySection
                section={sections[currentSection]}
                responses={responses[sections[currentSection].id] || {}}
                onChange={(questionId, value) => handleResponseChange(sections[currentSection].id, questionId, value)}
                managerName={managerName || "your manager"}
              />
            )}

            {/* Comments Section - Show on last section */}
            {currentSection === sections.length - 1 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Additional Feedback</CardTitle>
                  <CardDescription>
                    If you have any specific recommendations to help {managerName || "your manager"} become more
                    effective at the above competencies, or any other feedback you would like to share, please add them
                    below:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share any additional feedback or recommendations..."
                    rows={4}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-4">
                {currentSection < sections.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNext() || (currentSection === 0 && !managerName.trim())}
                    className="flex items-center space-x-2"
                  >
                    <span>Next Section</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceedToNext() || !managerName.trim() || getOverallProgress() < 100}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Submit Assessment</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Section Progress Indicator */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Section Progress: {Math.round(getCurrentSectionProgress())}% complete (
                {Object.keys(responses[sections[currentSection]?.id] || {}).length} of{" "}
                {sections[currentSection]?.questions.length} questions answered)
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
