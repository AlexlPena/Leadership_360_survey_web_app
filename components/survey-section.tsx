"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LikertQuestion } from "./likert-question"
import type { Section } from "../types/survey"

interface SurveySectionProps {
  section: Section
  responses: Record<string, string>
  onChange: (questionId: string, value: string) => void
  managerName?: string
}

export function SurveySection({ section, responses, onChange, managerName }: SurveySectionProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl text-gray-900">{section.title}</CardTitle>
        <p className="text-sm text-gray-600 leading-relaxed">
          {section.description?.replace("{managerName}", managerName || "this person") ||
            `How often does ${managerName || "this person"} practice the following behaviors related to ${section.title}?`}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {section.questions.map((question) => (
          <LikertQuestion
            key={question.id}
            question={question}
            value={responses[question.id] || ""}
            onChange={(value) => onChange(question.id, value)}
            managerName={managerName}
          />
        ))}
      </CardContent>
    </Card>
  )
}
