"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Question } from "../types/survey"

interface LikertQuestionProps {
  question: Question
  value: string
  onChange: (value: string) => void
  managerName?: string
}

export function LikertQuestion({ question, value, onChange, managerName }: LikertQuestionProps) {
  // Replace {managerName} placeholder in question text if present
  const questionText = question.text.replace("{managerName}", managerName || "this person")

  const LIKERT_OPTIONS = [
    { value: "never", label: "Never" },
    { value: "rarely", label: "Rarely" },
    { value: "sometimes", label: "Sometimes" },
    { value: "often", label: "Often" },
    { value: "always", label: "Always" },
  ]

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{questionText}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-6 gap-1 sm:gap-2 text-center">
        {LIKERT_OPTIONS.map((option) => (
          <div key={option.value} className="flex flex-col items-center space-y-1">
            <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} className="peer sr-only" />
            <Label
              htmlFor={`${question.id}-${option.value}`}
              className="w-full py-2 px-1 sm:px-3 rounded-md text-xs sm:text-sm cursor-pointer border border-gray-200 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:border-blue-200 peer-data-[state=checked]:text-blue-600 hover:bg-gray-50"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
