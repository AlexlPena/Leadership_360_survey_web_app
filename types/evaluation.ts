export interface Question {
  id: string
  text: string
}

export interface Section {
  id: string
  title: string
  description: string
  questions: Question[]
}

export interface EvaluationResponse {
  questionId: string
  value: string
}
