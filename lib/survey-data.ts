import type { SurveySection } from "@/types/survey"
import { surveyConfigManager } from "@/components/survey-editor"

// Get survey sections from configuration
export const getEmployeeSections = (): SurveySection[] => {
  return surveyConfigManager.getSurveyConfig().employee
}

export const getSupervisorSections = (): SurveySection[] => {
  return surveyConfigManager.getSurveyConfig().supervisor
}

export const getDirectorSections = (): SurveySection[] => {
  return surveyConfigManager.getSurveyConfig().director
}

export const getManagerSections = (): SurveySection[] => {
  return surveyConfigManager.getSurveyConfig().manager
}

// Legacy exports for backward compatibility
export const EMPLOYEE_SECTIONS = getEmployeeSections()
export const SUPERVISOR_SECTIONS = getSupervisorSections()
export const DIRECTOR_SECTIONS = getDirectorSections()
export const MANAGER_SECTIONS = getManagerSections()

export const LIKERT_OPTIONS = [
  { value: "1", label: "Never" },
  { value: "2", label: "Rarely" },
  { value: "3", label: "Sometimes" },
  { value: "4", label: "Often" },
  { value: "5", label: "Always" },
]

// Utility function to get sections by type
export const getSectionsByType = (type: string): SurveySection[] => {
  switch (type) {
    case "employee":
      return getEmployeeSections()
    case "supervisor":
      return getSupervisorSections()
    case "director":
      return getDirectorSections()
    case "manager":
      return getManagerSections()
    default:
      return getEmployeeSections()
  }
}

// Function to refresh sections (useful after configuration changes)
export const refreshSurveyData = () => {
  // This will force a re-read from localStorage
  const config = surveyConfigManager.getSurveyConfig()
  return config
}
