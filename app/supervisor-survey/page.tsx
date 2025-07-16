"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, UserCheck, MessageSquare, ArrowLeft } from "lucide-react"
import { Navigation } from "../../components/navigation"
import { SurveySection } from "../../components/survey-section"
import { dataStore } from "../../lib/data-store"
import { collectSubmissionData } from "../../lib/ip-tracker"
import Link from "next/link"
import { getSupervisorSections } from "../../lib/survey-data"

export default function SupervisorSurveyPage() {
  const router = useRouter()
  const [supervisorName, setSupervisorName] = useState("")
  const [showSurvey, setShowSurvey] = useState(false)
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({
    trust: {},
    communication: {},
    collaboration: {},
    accountability: {},
    motivation: {},
    development: {},
  })

  const [sections, setSections] = useState(getSupervisorSections())

  useEffect(() => {
    setSections(getSupervisorSections())
  }, [])

  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleStartSurvey = async () => {
    if (!supervisorName.trim()) {
      setErrors(["Please enter your name"])
      return
    }
    setErrors([])
    setShowSurvey(true)
  }

  const handleResponseChange = (sectionId: string, questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [questionId]: value,
      },
    }))

    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (!responses[section.id]?.[question.id]) {
          newErrors.push(`Please answer: "${question.text}"`)
        }
      })
    })

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validateForm()
    if (formErrors.length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      // Collect fresh submission data
      const finalSubmissionData = await collectSubmissionData()

      await dataStore.addSubmission({
        type: "supervisor",
        anonymousId: "", // No anonymous ID for self-assessments
        submittedAt: new Date(),
        status: "completed",
        responses,
        comments,
        managerName: supervisorName,
        ipAddress: finalSubmissionData.ipAddress,
        userAgent: finalSubmissionData.userAgent,
        submissionLocation: finalSubmissionData.submissionLocation,
      })

      setIsSubmitted(true)
    } catch (error) {
      setErrors(["An error occurred while submitting your self-assessment. Please try again."])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Self-Assessment Complete!</h2>
                <p className="text-gray-600 mb-4">Your leadership self-assessment has been submitted successfully.</p>
                <p className="text-sm text-gray-500 mb-6">
                  Use these insights to continue your leadership development journey.
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
    )
  }

  if (!showSurvey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <UserCheck className="h-8 w-8 text-green-600 mr-2" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Self-Assessment</h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Please enter your name to begin the self-assessment.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription>
                      <div className="space-y-1">
                        {errors.map((error, index) => (
                          <p key={index} className="text-red-800">
                            {error}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="supervisor-name">Your Name</Label>
                  <Input
                    id="supervisor-name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full"
                  />
                </div>

                <Button onClick={handleStartSurvey} className="w-full">
                  Start Self-Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-green-600 mr-2" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Self-Assessment - {supervisorName}</h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Reflect honestly on your leadership performance across key areas. This self-assessment will help
                identify strengths and opportunities for growth in your leadership journey.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Messages */}
            {errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-red-800">Please complete all required fields:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {errors.slice(0, 3).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {errors.length > 3 && <li>... and {errors.length - 3} more questions</li>}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Survey Sections */}
            {sections.map((section) => (
              <SurveySection
                key={section.id}
                section={section}
                responses={responses[section.id] || {}}
                onChange={(questionId, value) => handleResponseChange(section.id, questionId, value)}
                managerName={supervisorName}
              />
            ))}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl text-gray-900">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Development Areas
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Are there any areas you would like to develop that are not covered above? If so, please add them
                  below:
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-sm font-medium text-gray-700">
                    Additional Development Areas (Optional)
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Describe any additional areas you would like to develop or improve..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 text-base font-medium"
              >
                {isSubmitting ? "Submitting..." : "Complete Self-Assessment"}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This self-assessment is for your personal development and will be used to improve leadership
              effectiveness.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
