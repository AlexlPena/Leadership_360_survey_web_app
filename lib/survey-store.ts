import type { CustomSurvey } from "../types/custom-survey"

interface SurveyResponse {
  surveyId: string
  respondentType: string
  anonymousId: string
  responses: Record<string, any>
  submittedAt: Date
  status: string
}

class SurveyStore {
  private surveysKey = "custom-surveys"
  private responsesKey = "survey-responses"

  async getSurveyById(id: string): Promise<(CustomSurvey & { isActive: boolean }) | null> {
    if (typeof window === "undefined") return null

    try {
      const surveys = this.getSurveys()
      const survey = surveys.find((s) => s.id === id)
      return survey ? { ...survey, isActive: true } : null
    } catch (error) {
      console.error("Error loading survey:", error)
      return null
    }
  }

  getSurveys(): CustomSurvey[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.surveysKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading surveys:", error)
      return []
    }
  }

  async saveSurveyResponse(response: SurveyResponse): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const existing = this.getResponses()
      const newResponse = {
        ...response,
        id: Math.random().toString(36).substr(2, 9),
      }

      existing.push(newResponse)
      localStorage.setItem(this.responsesKey, JSON.stringify(existing))
    } catch (error) {
      console.error("Error saving survey response:", error)
      throw error
    }
  }

  getResponses(): SurveyResponse[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.responsesKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading responses:", error)
      return []
    }
  }
}

export const surveyStore = new SurveyStore()
