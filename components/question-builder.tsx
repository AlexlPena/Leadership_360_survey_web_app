"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, GripVertical } from "lucide-react"
import type { Question } from "../types/survey"

interface QuestionBuilderProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: () => void
}

export function QuestionBuilder({ question, onUpdate, onDelete }: QuestionBuilderProps) {
  const [options, setOptions] = useState(question.options || [])

  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates })
  }

  const addOption = () => {
    const newOptions = [...options, ""]
    setOptions(newOptions)
    updateQuestion({ options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    updateQuestion({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    updateQuestion({ options: newOptions })
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-lg">Question</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor={`title-${question.id}`}>Question Title</Label>
          <Input
            id={`title-${question.id}`}
            value={question.title}
            onChange={(e) => updateQuestion({ title: e.target.value })}
            placeholder="Enter your question"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`type-${question.id}`}>Question Type</Label>
          <Select value={question.type} onValueChange={(value: Question["type"]) => updateQuestion({ type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Short Text</SelectItem>
              <SelectItem value="textarea">Long Text</SelectItem>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="rating">Rating Scale</SelectItem>
              <SelectItem value="yes-no">Yes/No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {question.type === "multiple-choice" && (
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button variant="ghost" size="sm" onClick={() => removeOption(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}

        {question.type === "rating" && (
          <div className="grid gap-2">
            <Label htmlFor={`rating-${question.id}`}>Maximum Rating</Label>
            <Select
              value={question.maxRating?.toString() || "5"}
              onValueChange={(value) => updateQuestion({ maxRating: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">1-3 Scale</SelectItem>
                <SelectItem value="5">1-5 Scale</SelectItem>
                <SelectItem value="10">1-10 Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id={`required-${question.id}`}
            checked={question.required}
            onCheckedChange={(checked) => updateQuestion({ required: checked })}
          />
          <Label htmlFor={`required-${question.id}`}>Required</Label>
        </div>
      </CardContent>
    </Card>
  )
}
