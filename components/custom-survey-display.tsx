"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import type { CustomSurveyQuestion } from "../types/custom-survey"

interface CustomSurveyDisplayProps {
  question: CustomSurveyQuestion
  value: string | number | string[]
  onChange: (value: string | number | string[]) => void
}

export function CustomSurveyDisplay({ question, value, onChange }: CustomSurveyDisplayProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const currentRating = Number(value) || 0

  const handleRatingChange = (ratingValue: number) => {
    onChange(ratingValue)
  }

  const renderQuestionInput = () => {
    switch (question.type) {
      case "open-ended":
        return (
          <Textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
            rows={4}
            className="resize-none"
          />
        )

      case "multiple-choice":
        return (
          <RadioGroup value={value as string} onValueChange={onChange}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "likert-scale":
        const scale = question.likertScale || { min: 1, max: 5 }
        const labels = scale.labels || []

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
                const ratingValue = scale.min + i
                const label = labels[i] || ratingValue.toString()
                const isSelected = ratingValue === currentRating
                const isHovered = ratingValue <= hoverRating

                return (
                  <div key={ratingValue} className="flex flex-col items-center space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${isSelected ? "text-yellow-500" : ""}`}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRatingChange(ratingValue)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          isHovered || isSelected ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </Button>
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                )
              })}
            </div>
            {currentRating > 0 && (
              <p className="text-sm text-center text-gray-600">
                Selected: {currentRating} - {labels[currentRating - scale.min] || currentRating}
              </p>
            )}
          </div>
        )

      case "yes-no":
        return (
          <RadioGroup value={value as string} onValueChange={onChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </RadioGroup>
        )

      default:
        return <p className="text-red-500">Unknown question type</p>
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="text-base font-medium">
            {question.text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderQuestionInput()}
        </div>
      </CardContent>
    </Card>
  )
}
