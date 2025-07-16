"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateTestData } from "@/utils/generate-test-data"
import { dataStore } from "@/lib/data-store"

export function TestDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<"success" | "error" | null>(null)

  const handleGenerateTestData = async () => {
    try {
      setIsGenerating(true)
      setMessage(null)
      setStatus(null)

      const result = await generateTestData()

      if (result.success) {
        setStatus("success")
        setMessage(result.message)
      } else {
        setStatus("error")
        setMessage(result.message || "An error occurred while generating test data.")
      }
    } catch (error) {
      console.error("Error generating test data:", error)
      setStatus("error")
      setMessage("An unexpected error occurred while generating test data.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearData = () => {
    try {
      dataStore.clearSubmissions()
      setStatus("success")
      setMessage("All data cleared successfully!")
    } catch (error) {
      console.error("Error clearing data:", error)
      setStatus("error")
      setMessage("An error occurred while clearing data.")
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Data Generation</CardTitle>
          <CardDescription>Generate sample survey data for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Generate complete survey submissions for all 4 assessment types for recipient &quot;John Doe&quot;. This
            will create realistic test data to populate the admin dashboard.
          </p>
          <div className="grid gap-4">
            <Button onClick={handleGenerateTestData} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Test Data for John Doe"}
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
              Quick Test Export (First Recipient)
            </Button>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md ${status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {message}
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">This will create:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
              <li>1 Self Assessment</li>
              <li>1 Peer & Colleague Assessment</li>
              <li>1 Direct Report Assessment</li>
              <li>1 Manager Assessment</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage survey data and storage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Clear all survey data from local storage. This action cannot be undone and will remove all submissions and
            aggregated data.
          </p>
          <Button variant="destructive" onClick={handleClearData}>
            Clear All Data
          </Button>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">This will remove:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
              <li>All survey submissions</li>
              <li>All aggregated data</li>
              <li>All recipient records</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Data Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800">Self Assessments</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800">Peer & Colleague Assessments</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800">Direct Report Assessments</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800">Manager Assessments</h3>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
