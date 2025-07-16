"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Edit, Eye, Globe, Monitor, MapPin } from "lucide-react"
import type { SurveyResponse } from "../types/survey"

interface ViewEditModalProps {
  submission: SurveyResponse | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<SurveyResponse>) => Promise<void>
}

const LIKERT_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "always", label: "Always" },
]

// Score mapping for analytics
const SCORE_MAP = {
  never: 1,
  rarely: 2,
  sometimes: 3,
  often: 4,
  always: 5,
}

export function ViewEditModal({ submission, isOpen, onClose, onSave }: ViewEditModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubmission, setEditedSubmission] = useState<SurveyResponse | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (submission) {
      setEditedSubmission({ ...submission })
      setIsEditing(false)
    }
  }, [submission])

  if (!submission || !editedSubmission) return null

  // Helper function to extract manager number from Manager_ID
  const getManagerNumber = (managerId: string) => {
    return managerId?.replace("Manager_", "") || ""
  }

  const handleResponseChange = (sectionId: string, questionId: string, value: string) => {
    setEditedSubmission((prev) =>
      prev
        ? {
            ...prev,
            responses: {
              ...prev.responses,
              [sectionId]: {
                ...prev.responses[sectionId],
                [questionId]: value,
              },
            },
          }
        : null,
    )
  }

  const handleCommentsChange = (comments: string) => {
    setEditedSubmission((prev) => (prev ? { ...prev, comments } : null))
  }

  const handleSave = async () => {
    if (!editedSubmission) return

    setIsSaving(true)
    try {
      await onSave(editedSubmission.id, {
        responses: editedSubmission.responses,
        comments: editedSubmission.comments,
        status: "reviewed",
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      "in-progress": "secondary",
      reviewed: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status.replace("-", " ")}</Badge>
  }

  const formatLocation = (location: string) => {
    if (!location) return "Not available"
    const [lat, lng] = location.split(", ")
    return `${Number.parseFloat(lat).toFixed(4)}, ${Number.parseFloat(lng).toFixed(4)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {submission.type === "supervisor"
                ? "Self-Assessment"
                : submission.type === "director"
                  ? "Direct Assessment"
                  : submission.type === "manager"
                    ? "Manager Assessment"
                    : "Peer Assessment"}{" "}
              - {submission.id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(submission.status)}
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            Manager:
            <span className="text-xs text-gray-500 font-mono">{getManagerNumber(submission.managerId || "")}</span>
            <span>{submission.managerName}</span>| Submitted: {submission.submittedAt.toLocaleDateString()} at{" "}
            {submission.submittedAt.toLocaleTimeString()}
            {submission.lastModified && (
              <span className="ml-4">Last modified: {submission.lastModified.toLocaleDateString()}</span>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="responses">Survey Responses</TabsTrigger>
            <TabsTrigger value="tracking">Submission Details</TabsTrigger>
          </TabsList>

          <TabsContent value="responses" className="space-y-6">
            {Object.keys(submission.responses).map((sectionId) => (
              <Card key={sectionId}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{sectionId}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(submission.responses[sectionId] || {}).map(([questionId, response]) => (
                    <div key={questionId} className="space-y-2">
                      <Label className="text-sm font-medium">Question ID: {questionId}</Label>
                      {isEditing ? (
                        <Select
                          value={editedSubmission.responses[sectionId]?.[questionId] || ""}
                          onValueChange={(value) => handleResponseChange(sectionId, questionId, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select response" />
                          </SelectTrigger>
                          <SelectContent>
                            {LIKERT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border">
                          {LIKERT_OPTIONS.find((opt) => opt.value === response)?.label || "No response"}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Open-Ended Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedSubmission.comments}
                    onChange={(e) => handleCommentsChange(e.target.value)}
                    placeholder="Additional feedback..."
                    rows={4}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded border min-h-[100px]">
                    {submission.comments || "No feedback provided"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Submission Tracking Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Technical details about how and when this survey was submitted (Admin Only)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <div>
                        <Label className="text-sm font-medium">IP Address</Label>
                        <p className="text-sm text-gray-600 font-mono">{submission.ipAddress || "Not recorded"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <p className="text-sm text-gray-600">
                          {submission.submissionLocation
                            ? formatLocation(submission.submissionLocation)
                            : "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Device Information</Label>
                      <p className="text-xs text-gray-600 break-all">{submission.userAgent || "Not recorded"}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Submission Timeline</Label>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Started: {submission.submittedAt.toLocaleString()}</p>
                        {submission.lastModified && <p>Modified: {submission.lastModified.toLocaleString()}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isEditing && (
            <Button onClick={handleSave} disabled={isSaving}>
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
