"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  AlertTriangle,
  CheckCircle,
  Users,
  UserCheck,
  UserCog,
  User,
  Eye,
} from "lucide-react"
import type { SurveySection, SurveyQuestion } from "../types/survey"

interface SurveyEditorProps {
  onSave: (sections: SurveySection[], surveyType: string) => void
  onCancel: () => void
}

// Survey configuration store
const SURVEY_CONFIG_KEY = "leadership-survey-config"

interface SurveyConfig {
  employee: SurveySection[]
  supervisor: SurveySection[]
  director: SurveySection[]
  manager: SurveySection[]
}

// Default survey configurations
const getDefaultSurveyConfig = (): SurveyConfig => ({
  employee: [
    {
      id: "building-trust",
      title: "Building Trust",
      description: "Evaluate how often your peer practices the following behaviors related to Building Trust.",
      questions: [
        {
          id: "building-trust-1",
          text: "Shows genuine care for others.",
          type: "likert",
        },
        {
          id: "building-trust-2",
          text: "Exhibits sound judgment and high ethical standards.",
          type: "likert",
        },
      ],
    },
    {
      id: "communicating-effectively",
      title: "Communicating Effectively",
      description:
        "Evaluate how often your peer practices the following behaviors related to Communicating Effectively.",
      questions: [
        {
          id: "communicating-effectively-1",
          text: "Communicates in a clear and concise manner.",
          type: "likert",
        },
        {
          id: "communicating-effectively-2",
          text: "Listens effectively and seeks to understand what others are saying.",
          type: "likert",
        },
      ],
    },
    {
      id: "collaborating-effectively",
      title: "Collaborating Effectively",
      description:
        "Evaluate how often your peer practices the following behaviors related to Collaborating Effectively.",
      questions: [
        {
          id: "collaborating-effectively-1",
          text: "Proactively seeks out the views, perspectives, and priorities of others.",
          type: "likert",
        },
        {
          id: "collaborating-effectively-2",
          text: "When disagreements arise, encourages open discussion to achieve productive outcomes.",
          type: "likert",
        },
      ],
    },
    {
      id: "driving-accountability",
      title: "Driving Accountability and Results",
      description:
        "Evaluate how often your peer practices the following behaviors related to Driving Accountability and Results.",
      questions: [
        {
          id: "driving-accountability-1",
          text: "Demonstrates a strong focus on achieving results.",
          type: "likert",
        },
        {
          id: "driving-accountability-2",
          text: "Takes ownership for meeting company goals and performance targets.",
          type: "likert",
        },
        {
          id: "driving-accountability-3",
          text: "Translates company goals and performance targets into clear, actionable plans for their team.",
          type: "likert",
        },
        {
          id: "driving-accountability-4",
          text: "Clearly defines roles, responsibilities, and behavioral expectations necessary to achieve success.",
          type: "likert",
        },
        {
          id: "driving-accountability-5",
          text: "Provides their team with regular feedback on their performance and progress against expectations.",
          type: "likert",
        },
        {
          id: "driving-accountability-6",
          text: "Holds others accountable for achieving results and upholding behavioral expectations.",
          type: "likert",
        },
      ],
    },
    {
      id: "motivating-others",
      title: "Motivating Others",
      description: "Evaluate how often your peer practices the following behaviors related to Motivating Others.",
      questions: [
        {
          id: "motivating-others-1",
          text: "Seeks to understand what motivates each direct report and puts it into practice.",
          type: "likert",
        },
        {
          id: "motivating-others-2",
          text: "Recognizes and rewards others for their contributions and accomplishments.",
          type: "likert",
        },
      ],
    },
    {
      id: "developing-others",
      title: "Developing Others",
      description: "Evaluate how often your peer practices the following behaviors related to Developing Others.",
      questions: [
        {
          id: "developing-others-1",
          text: "Conducts career development conversations with direct reports.",
          type: "likert",
        },
        {
          id: "developing-others-2",
          text: "Provides direct reports with resources, opportunities, and/or coaching to grow and develop.",
          type: "likert",
        },
      ],
    },
  ],
  supervisor: [
    {
      id: "building-trust",
      title: "Building Trust",
      description: "Evaluate your behaviors related to building trust with others.",
      questions: [
        {
          id: "building-trust-1",
          text: "I show genuine care for others.",
          type: "likert",
        },
        {
          id: "building-trust-2",
          text: "I exhibit sound judgment and high ethical standards.",
          type: "likert",
        },
      ],
    },
    {
      id: "communicating-effectively",
      title: "Communicating Effectively",
      description: "Evaluate your communication effectiveness.",
      questions: [
        {
          id: "communicating-effectively-1",
          text: "I communicate in a clear and concise manner.",
          type: "likert",
        },
        {
          id: "communicating-effectively-2",
          text: "I listen effectively and seek to understand what others are saying.",
          type: "likert",
        },
      ],
    },
    {
      id: "collaborating-effectively",
      title: "Collaborating Effectively",
      description: "Evaluate your collaboration effectiveness.",
      questions: [
        {
          id: "collaborating-effectively-1",
          text: "I proactively seek out the views, perspectives, and priorities of others.",
          type: "likert",
        },
        {
          id: "collaborating-effectively-2",
          text: "When disagreements arise, I encourage open discussion to achieve productive outcomes.",
          type: "likert",
        },
      ],
    },
    {
      id: "driving-accountability",
      title: "Driving Accountability and Results",
      description: "Evaluate your effectiveness in driving accountability and results.",
      questions: [
        {
          id: "driving-accountability-1",
          text: "I demonstrate a strong focus on achieving results.",
          type: "likert",
        },
        {
          id: "driving-accountability-2",
          text: "I take ownership for meeting company goals and performance targets.",
          type: "likert",
        },
        {
          id: "driving-accountability-3",
          text: "I translate company goals and performance targets into clear, actionable plans for my team.",
          type: "likert",
        },
        {
          id: "driving-accountability-4",
          text: "I clearly define roles, responsibilities, and behavioral expectations necessary to achieve success.",
          type: "likert",
        },
        {
          id: "driving-accountability-5",
          text: "I provide my team with regular feedback on their performance and progress against expectations.",
          type: "likert",
        },
        {
          id: "driving-accountability-6",
          text: "I hold others accountable for achieving results and upholding behavioral expectations.",
          type: "likert",
        },
      ],
    },
    {
      id: "motivating-others",
      title: "Motivating Others",
      description: "Evaluate your effectiveness in motivating others.",
      questions: [
        {
          id: "motivating-others-1",
          text: "I seek to understand what motivates each direct report and put it into practice.",
          type: "likert",
        },
        {
          id: "motivating-others-2",
          text: "I recognize and reward others for their contributions and accomplishments.",
          type: "likert",
        },
      ],
    },
    {
      id: "developing-others",
      title: "Developing Others",
      description: "Evaluate your effectiveness in developing others.",
      questions: [
        {
          id: "developing-others-1",
          text: "I conduct career development conversations with my direct reports.",
          type: "likert",
        },
        {
          id: "developing-others-2",
          text: "I provide my direct reports with resources, opportunities, and/or coaching to grow and develop.",
          type: "likert",
        },
      ],
    },
  ],
  director: [
    {
      id: "building-trust",
      title: "Building Trust",
      description: "Evaluate how often your leader practices the following behaviors related to Building Trust.",
      questions: [
        {
          id: "building-trust-1",
          text: "Shows genuine care for me.",
          type: "likert",
        },
        {
          id: "building-trust-2",
          text: "Exhibits sound judgment and high ethical standards.",
          type: "likert",
        },
      ],
    },
    {
      id: "communicating-effectively",
      title: "Communicating Effectively",
      description:
        "Evaluate how often your leader practices the following behaviors related to Communicating Effectively.",
      questions: [
        {
          id: "communicating-effectively-1",
          text: "Communicates with me in a clear and concise manner.",
          type: "likert",
        },
        {
          id: "communicating-effectively-2",
          text: "Listens effectively and seeks to understand what I am saying.",
          type: "likert",
        },
      ],
    },
    {
      id: "collaborating-effectively",
      title: "Collaborating Effectively",
      description:
        "Evaluate how often your leader practices the following behaviors related to Collaborating Effectively.",
      questions: [
        {
          id: "collaborating-effectively-1",
          text: "Proactively seeks out my views, perspectives, and priorities.",
          type: "likert",
        },
        {
          id: "collaborating-effectively-2",
          text: "When disagreements arise, encourages open discussion to achieve productive outcomes.",
          type: "likert",
        },
      ],
    },
    {
      id: "driving-accountability",
      title: "Driving Accountability and Results",
      description:
        "Evaluate how often your leader practices the following behaviors related to Driving Accountability and Results.",
      questions: [
        {
          id: "driving-accountability-1",
          text: "Demonstrates a strong focus on achieving results.",
          type: "likert",
        },
        {
          id: "driving-accountability-2",
          text: "Takes ownership for meeting company goals and performance targets.",
          type: "likert",
        },
        {
          id: "driving-accountability-3",
          text: "Translates company goals and performance targets into clear, actionable plans for our team.",
          type: "likert",
        },
        {
          id: "driving-accountability-4",
          text: "Clearly defines roles, responsibilities, and behavioral expectations necessary to achieve success.",
          type: "likert",
        },
        {
          id: "driving-accountability-5",
          text: "Provides me with regular feedback on my performance and progress against expectations.",
          type: "likert",
        },
        {
          id: "driving-accountability-6",
          text: "Holds me accountable for achieving results and upholding behavioral expectations.",
          type: "likert",
        },
      ],
    },
    {
      id: "motivating-others",
      title: "Motivating Others",
      description: "Evaluate how often your leader practices the following behaviors related to Motivating Others.",
      questions: [
        {
          id: "motivating-others-1",
          text: "Seeks to understand what motivates me and puts it into practice.",
          type: "likert",
        },
        {
          id: "motivating-others-2",
          text: "Recognizes and rewards me for my contributions and accomplishments.",
          type: "likert",
        },
      ],
    },
    {
      id: "developing-others",
      title: "Developing Others",
      description: "Evaluate how often your leader practices the following behaviors related to Developing Others.",
      questions: [
        {
          id: "developing-others-1",
          text: "Conducts career development conversations with me.",
          type: "likert",
        },
        {
          id: "developing-others-2",
          text: "Provides me with resources, opportunities, and/or coaching to grow and develop.",
          type: "likert",
        },
      ],
    },
  ],
  manager: [
    {
      id: "building-trust",
      title: "Building Trust",
      description: "How often does your manager practice the following behaviors related to Building Trust?",
      questions: [
        {
          id: "building-trust-1",
          text: "Shows genuine care for others.",
          type: "likert",
        },
        {
          id: "building-trust-2",
          text: "Exhibits sound judgment and high ethical standards.",
          type: "likert",
        },
      ],
    },
    {
      id: "communicating-effectively",
      title: "Communicating Effectively",
      description: "How often does your manager practice the following behaviors related to Communicating Effectively?",
      questions: [
        {
          id: "communicating-effectively-1",
          text: "Communicates in a clear and concise manner.",
          type: "likert",
        },
        {
          id: "communicating-effectively-2",
          text: "Listens effectively and seeks to understand what others are saying.",
          type: "likert",
        },
      ],
    },
    {
      id: "collaborating-effectively",
      title: "Collaborating Effectively",
      description: "How often does your manager practice the following behaviors related to Collaborating Effectively?",
      questions: [
        {
          id: "collaborating-effectively-1",
          text: "Proactively seeks out the views, perspectives, and priorities of others.",
          type: "likert",
        },
        {
          id: "collaborating-effectively-2",
          text: "When disagreements arise, encourages open discussion to achieve productive outcomes.",
          type: "likert",
        },
      ],
    },
    {
      id: "driving-accountability",
      title: "Driving Accountability and Results",
      description:
        "How often does your manager practice the following behaviors related to Driving Accountability and Results?",
      questions: [
        {
          id: "driving-accountability-1",
          text: "Demonstrates a strong focus on achieving results.",
          type: "likert",
        },
        {
          id: "driving-accountability-2",
          text: "Takes ownership for meeting company goals and performance targets.",
          type: "likert",
        },
        {
          id: "driving-accountability-3",
          text: "Translates company goals and performance targets into clear, actionable plans for their team.",
          type: "likert",
        },
        {
          id: "driving-accountability-4",
          text: "Clearly defines roles, responsibilities, and behavioral expectations necessary to achieve success.",
          type: "likert",
        },
        {
          id: "driving-accountability-5",
          text: "Provides their team with regular feedback on their performance and progress against expectations.",
          type: "likert",
        },
        {
          id: "driving-accountability-6",
          text: "Holds others accountable for achieving results and upholding behavioral expectations.",
          type: "likert",
        },
      ],
    },
    {
      id: "motivating-others",
      title: "Motivating Others",
      description: "How often does your manager practice the following behaviors related to Motivating Others?",
      questions: [
        {
          id: "motivating-others-1",
          text: "Seeks to understand what motivates each direct report and puts it into practice.",
          type: "likert",
        },
        {
          id: "motivating-others-2",
          text: "Recognizes and rewards others for their contributions and accomplishments.",
          type: "likert",
        },
      ],
    },
    {
      id: "developing-others",
      title: "Developing Others",
      description: "How often does your manager practice the following behaviors related to Developing Others?",
      questions: [
        {
          id: "developing-others-1",
          text: "Conducts career development conversations with me.",
          type: "likert",
        },
        {
          id: "developing-others-2",
          text: "Provides me with resources, opportunities, and/or coaching to grow and develop.",
          type: "likert",
        },
      ],
    },
  ],
})

// Survey configuration management
export const surveyConfigManager = {
  getSurveyConfig(): SurveyConfig {
    if (typeof window === "undefined") return getDefaultSurveyConfig()

    try {
      const stored = localStorage.getItem(SURVEY_CONFIG_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("Error loading survey config:", error)
    }

    return getDefaultSurveyConfig()
  },

  saveSurveyConfig(config: SurveyConfig): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(SURVEY_CONFIG_KEY, JSON.stringify(config))
      console.log("Survey configuration saved successfully")
    } catch (error) {
      console.error("Error saving survey config:", error)
      throw error
    }
  },

  resetToDefaults(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(SURVEY_CONFIG_KEY)
      console.log("Survey configuration reset to defaults")
    } catch (error) {
      console.error("Error resetting survey config:", error)
      throw error
    }
  },
}

// Add this function to handle backward compatibility
const migrateQuestionLabels = (config: SurveyConfig): SurveyConfig => {
  const migratedConfig = { ...config }

  Object.keys(migratedConfig).forEach((surveyType) => {
    const sections = migratedConfig[surveyType as keyof SurveyConfig]
    sections.forEach((section) => {
      section.questions.forEach((question, index) => {
        if (!question.label) {
          question.label = `Question ${index + 1}`
        }
      })
    })
  })

  return migratedConfig
}

export function SurveyEditor({ onSave, onCancel }: SurveyEditorProps) {
  const [config, setConfig] = useState<SurveyConfig>(getDefaultSurveyConfig())
  const [activeTab, setActiveTab] = useState("employee")
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    loadConfig()
  }, [])

  // Update the loadConfig function
  const loadConfig = () => {
    try {
      let loadedConfig = surveyConfigManager.getSurveyConfig()
      // Migrate any existing configs that don't have labels
      loadedConfig = migrateQuestionLabels(loadedConfig)
      setConfig(loadedConfig)
    } catch (error) {
      console.error("Error loading config:", error)
    }
  }

  const handleSectionUpdate = (sectionIndex: number, updatedSection: SurveySection) => {
    const newConfig = { ...config }
    newConfig[activeTab as keyof SurveyConfig][sectionIndex] = updatedSection
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const handleQuestionUpdate = (sectionIndex: number, questionIndex: number, updatedQuestion: SurveyQuestion) => {
    const newConfig = { ...config }
    newConfig[activeTab as keyof SurveyConfig][sectionIndex].questions[questionIndex] = {
      ...updatedQuestion,
      // Ensure we maintain the question structure
      label: updatedQuestion.label || `Question ${questionIndex + 1}`,
    }
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const addQuestion = (sectionIndex: number) => {
    const newConfig = { ...config }
    const section = newConfig[activeTab as keyof SurveyConfig][sectionIndex]
    const newQuestionId = `${section.id}-${section.questions.length + 1}`
    const questionNumber = section.questions.length + 1

    const newQuestion: SurveyQuestion = {
      id: newQuestionId,
      text: "New question text",
      type: "likert",
      label: `Question ${questionNumber}`,
    }

    section.questions.push(newQuestion)
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const newConfig = { ...config }
    newConfig[activeTab as keyof SurveyConfig][sectionIndex].questions.splice(questionIndex, 1)
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const addSection = () => {
    const newConfig = { ...config }
    const sections = newConfig[activeTab as keyof SurveyConfig]
    const newSectionId = `new-section-${sections.length + 1}`

    const newSection: SurveySection = {
      id: newSectionId,
      title: "New Section",
      description: "Description for the new section.",
      questions: [
        {
          id: `${newSectionId}-1`,
          text: "New question text",
          type: "likert",
        },
      ],
    }

    sections.push(newSection)
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const removeSection = (sectionIndex: number) => {
    if (config[activeTab as keyof SurveyConfig].length <= 1) {
      alert("Cannot remove the last section. At least one section is required.")
      return
    }

    const newConfig = { ...config }
    newConfig[activeTab as keyof SurveyConfig].splice(sectionIndex, 1)
    setConfig(newConfig)
    setHasChanges(true)
    setSaveStatus("idle")
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      surveyConfigManager.saveSurveyConfig(config)
      setSaveStatus("success")
      setHasChanges(false)

      // Trigger a reload of survey data in the parent component
      onSave(config[activeTab as keyof SurveyConfig], activeTab)

      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving config:", error)
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset all surveys to their default configuration? This action cannot be undone.",
      )
    ) {
      try {
        surveyConfigManager.resetToDefaults()
        const defaultConfig = getDefaultSurveyConfig()
        setConfig(defaultConfig)
        setHasChanges(false)
        setSaveStatus("idle")
        alert("Survey configuration has been reset to defaults.")
      } catch (error) {
        console.error("Error resetting config:", error)
        alert("Error resetting configuration. Please try again.")
      }
    }
  }

  const getSurveyTypeInfo = (type: string) => {
    const info = {
      employee: {
        title: "Peer & Colleague Assessment",
        description: "Questions for peer and colleague evaluations",
        icon: Users,
        color: "text-purple-600",
      },
      supervisor: {
        title: "Self Assessment",
        description: "Questions for self-evaluation",
        icon: User,
        color: "text-blue-600",
      },
      director: {
        title: "Direct Report Assessment",
        description: "Questions for direct report evaluations",
        icon: UserCheck,
        color: "text-green-600",
      },
      manager: {
        title: "Manager Assessment",
        description: "Questions for manager evaluations",
        icon: UserCog,
        color: "text-orange-600",
      },
    }
    return info[type as keyof typeof info]
  }

  const currentSections = config[activeTab as keyof SurveyConfig]
  const surveyInfo = getSurveyTypeInfo(activeTab)
  const Icon = surveyInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Survey Questions</h2>
          <p className="text-gray-600">Customize survey questions for each assessment type</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Saved successfully</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm">Save failed</span>
            </div>
          )}
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Unsaved changes
            </Badge>
          )}
        </div>
      </div>

      {/* Survey Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Peer & Colleague
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Self Assessment
          </TabsTrigger>
          <TabsTrigger value="director" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Direct Report
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Survey Type Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${surveyInfo.color}`} />
                {surveyInfo.title}
              </CardTitle>
              <p className="text-sm text-gray-600">{surveyInfo.description}</p>
            </CardHeader>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            {currentSections.map((section, sectionIndex) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <Input
                          value={section.title}
                          onChange={(e) => handleSectionUpdate(sectionIndex, { ...section, title: e.target.value })}
                          className="font-medium text-lg border-none p-0 h-auto focus-visible:ring-0"
                          placeholder="Section title"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(sectionIndex)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={currentSections.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.description}
                    onChange={(e) => handleSectionUpdate(sectionIndex, { ...section, description: e.target.value })}
                    className="border-none p-0 resize-none focus-visible:ring-0"
                    placeholder="Section description"
                    rows={2}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Questions Section */}
                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id} className="border rounded-lg p-4 space-y-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-4">
                          {/* Question Header */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {questionIndex + 1}
                            </div>
                            <div className="flex-1">
                              <Input
                                value={question.label || `Question ${questionIndex + 1}`}
                                onChange={(e) =>
                                  handleQuestionUpdate(sectionIndex, questionIndex, {
                                    ...question,
                                    label: e.target.value,
                                  })
                                }
                                className="font-medium border-none p-0 h-auto focus-visible:ring-0 text-base"
                                placeholder={`Question ${questionIndex + 1}`}
                              />
                            </div>
                          </div>

                          {/* Question Text */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Question Text</Label>
                            <Textarea
                              value={question.text}
                              onChange={(e) =>
                                handleQuestionUpdate(sectionIndex, questionIndex, { ...question, text: e.target.value })
                              }
                              className="mt-2"
                              placeholder="Enter the full question text that respondents will see"
                              rows={3}
                            />
                          </div>

                          {/* Question Metadata */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="font-medium text-gray-600">Question ID:</span>
                                <div className="font-mono text-gray-800">{question.id}</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Response Type:</span>
                                <div className="text-gray-800">Likert Scale (1-5)</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Position:</span>
                                <div className="text-gray-800">
                                  {questionIndex + 1} of {section.questions.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(sectionIndex, questionIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                          disabled={section.questions.length <= 1}
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add Question Button */}
                  <Button variant="outline" onClick={() => addQuestion(sectionIndex)} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Add Section Button */}
            <Button variant="outline" onClick={addSection} className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          {/* Add this after the questions section in each survey tab */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Survey Preview
              </CardTitle>
              <p className="text-sm text-gray-600">This is how your questions will appear to survey respondents</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSections.map((section, sectionIndex) => (
                <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{section.description}</p>

                  {section.questions.slice(0, 2).map((question, questionIndex) => (
                    <div key={question.id} className="mb-4 last:mb-0">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {question.label || `Question ${questionIndex + 1}`}
                      </div>
                      <div className="text-base text-gray-900 mb-2">{question.text}</div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>Never</span>
                        <span>Rarely</span>
                        <span>Sometimes</span>
                        <span>Often</span>
                        <span>Always</span>
                      </div>
                    </div>
                  ))}

                  {section.questions.length > 2 && (
                    <div className="text-xs text-gray-500 italic">
                      ... and {section.questions.length - 2} more questions
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning about existing data */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Changes to survey questions will affect all future survey submissions. Existing
            responses will continue to reference the original questions for data integrity.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleReset} className="text-red-600 border-red-200 hover:bg-red-50">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="min-w-[120px]">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
