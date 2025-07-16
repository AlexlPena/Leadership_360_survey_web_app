export interface AdminSubmission {
  id: string
  anonymousId: string
  managerName: string
  submittedAt: Date
  status: string
  lastModified?: Date
  responses: Record<string, any>
  comments?: string
}

export interface AdminStats {
  totalSubmissions: number
  completedToday: number
  responseRate: number
  averageCompletionTime: number
}

export { AggregatedSubmission } from "./survey"
