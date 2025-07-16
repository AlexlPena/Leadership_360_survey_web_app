"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ArrowLeft, FileText } from "lucide-react"
import { Navigation } from "../../../components/navigation"
import { CustomSurveyDisplay } from "../../../components/custom-survey-display"
import { ProtectedRoute } from "../../../components/protected-route"
import { surveyStore } from "../../../lib/survey-store"
import type { CustomSurvey } from "../../../types/custom-survey"
import Link from "next/link"

export default function CustomSurveyPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<CustomSurvey | null>(null)
  const [responses, setResponses] = useState<Record<string, string | number | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      const surveyData = await surveyStore.getSurveyById(surveyId)
      if (!surveyData || !surveyData.isActive) {
        router.push("/")
        return
      }
      setSurvey(surveyData)
    } catch (error) {
      console.error("Failed to load survey:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string | number | string[]) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): string[] => {
    if (!survey) return []

    const newErrors: string[] = []

    survey.questions.forEach((question) => {
      if (question.required && (!responses[question.id] || responses[question.id] === "")) {
        newErrors.push(`Please answer: "${question.text}"`)
      }
    })

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!survey) return

    const formErrors = validateForm()
    if (formErrors.length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      await surveyStore.saveSurveyResponse({
        surveyId: survey.id,
        respondentType: survey.targetAudience === "both" ? "employee" : survey.targetAudience,
        anonymousId: `${survey.targetAudience.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        responses,
        submittedAt: new Date(),
        status: "completed",
      })

      setIsSubmitted(true)
    } catch (error) {
      setErrors(["An error occurred while submitting your response. Please try again."])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <p>Survey not found or no longer available.</p>
              <Link href="/">
                <Button className="mt-4">Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600 mb-4">Your survey response has been submitted successfully.</p>
                <p className="text-sm text-gray-500 mb-6">Your feedback is valuable and will be kept confidential.</p>
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

  const getProtectionType = (): "employee" | "supervisor" => {
    if (survey.targetAudience === "both") return "employee" // Default to employee for "both"
    return survey.targetAudience
  }

  return (
    <ProtectedRoute
      type={getProtectionType()}
      title={`${survey.title} Access`}
      description={`Please enter the password to access this survey.`}
    >
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
                  <FileText className="h-8 w-8 text-blue-600 mr-2" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{survey.title}</h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">{survey.description}</p>
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

              {/* Survey Questions */}
              {survey.questions.map((question) => (
                <CustomSurveyDisplay
                  key={question.id}
                  question={question}
                  value={responses[question.id] || ""}
                  onChange={(value) => handleResponseChange(question.id, value)}
                />
              ))}

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 text-base font-medium"
                >
                  {isSubmitting ? "Submitting..." : "Submit Survey"}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="text-center mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                This survey is confidential and will be used for organizational improvement purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
