export interface SurveyQuestion {
  id: string
  text: string
  type: "likert" | "text" | "multiple-choice"
  label?: string // Optional custom label for the question
  order?: number // Optional custom ordering
}
