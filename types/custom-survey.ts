export interface CustomSurveyQuestion {
  id: string
  text: string
  type: "open-ended" | "multiple-choice" | "likert-scale" | "yes-no"
  required: boolean
  options?: string[]
  likertScale?: {
    min: number
    max: number
    labels?: string[]
  }
}

export interface CustomSurvey {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isActive: boolean
  targetAudience: "employee" | "supervisor" | "both"
  questions: CustomSurveyQuestion[]
}
