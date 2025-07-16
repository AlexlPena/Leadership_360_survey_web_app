"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { AggregatedSubmission } from "@/types/survey"
import { generateChartPreview } from "@/utils/chart-preview"

interface ChartPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  aggregatedData: AggregatedSubmission | null
}

export function ChartPreviewModal({ isOpen, onClose, onContinue, aggregatedData }: ChartPreviewModalProps) {
  const [chartUrl, setChartUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load the chart when the modal opens
  const loadChart = async () => {
    if (!aggregatedData || chartUrl) return

    setIsLoading(true)
    try {
      const url = await generateChartPreview(aggregatedData)
      setChartUrl(url)
    } catch (error) {
      console.error("Failed to load chart preview:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Call loadChart when the modal opens
  if (isOpen && !chartUrl && !isLoading && aggregatedData) {
    loadChart()
  }

  // Reset chart URL when modal closes
  const handleClose = () => {
    setChartUrl(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparison Chart Preview</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : chartUrl ? (
            <div className="flex flex-col items-center">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={chartUrl || "/placeholder.svg"}
                  alt="Comparison Chart Preview"
                  className="max-w-full h-auto"
                  style={{ maxHeight: "70vh" }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">This is how the chart will appear in the generated report.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Unable to load chart preview.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={onContinue} disabled={isLoading}>
            Continue to Report Generation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
