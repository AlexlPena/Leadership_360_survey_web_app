"use client"

import { Button } from "@/components/ui/button"
import { FileText, BarChart3 } from "lucide-react"
import { useState } from "react"
import { ChartPreviewModal } from "./chart-preview-modal"
import type { AggregatedSubmission } from "@/types/survey"

interface ExportOptionsProps {
  managerName: string
  aggregatedData: AggregatedSubmission | null
  onGenerateReport: () => void
}

export function ExportOptions({ managerName, aggregatedData, onGenerateReport }: ExportOptionsProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Choose how you would like to export the data for {managerName}:</p>
      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">View Comparison Chart</h4>
          <p className="text-sm text-gray-600 mb-3">Preview the comparison chart that will be included in the report</p>
          <Button onClick={() => setIsPreviewOpen(true)} className="w-full" size="sm" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Comparison Chart
          </Button>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Generate Leadership Assessment Report</h4>
          <p className="text-sm text-gray-600 mb-3">
            Create a comprehensive Word document with detailed analysis and feedback including comparison chart
          </p>
          <Button onClick={onGenerateReport} className="w-full" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Leadership Assessment Report
          </Button>
        </div>
      </div>

      <ChartPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onContinue={onGenerateReport}
        aggregatedData={aggregatedData}
      />
    </div>
  )
}
