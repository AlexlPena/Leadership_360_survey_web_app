"use client"

import { useEffect, useState } from "react"
import { ExportModalWrapper } from "@/components/export-modal-wrapper"
import type { AggregatedSubmission } from "@/types/survey"

// This component will be used to integrate the chart preview functionality
// without modifying the existing admin page code
export function ChartPreviewIntegration() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState<{
    name: string
    aggregatedData: AggregatedSubmission | null
  } | null>(null)

  // Listen for custom events from the admin page
  useEffect(() => {
    // Event handler for when the export button is clicked
    const handleExportClick = (event: CustomEvent) => {
      const { managerName, aggregatedData } = event.detail
      setSelectedManager({
        name: managerName,
        aggregatedData,
      })
      setIsExportModalOpen(true)

      // Prevent the original export modal from opening
      event.stopPropagation()
      event.preventDefault()
    }

    // Add event listener
    window.addEventListener("exportManager" as any, handleExportClick as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("exportManager" as any, handleExportClick as EventListener)
    }
  }, [])

  // Function to handle the "Generate Report" button click
  const handleGenerateReport = () => {
    // Close our modal
    setIsExportModalOpen(false)

    // Trigger the original document form to open
    if (selectedManager) {
      const event = new CustomEvent("openDocumentForm", {
        detail: { managerName: selectedManager.name, aggregatedData: selectedManager.aggregatedData },
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <>
      {selectedManager && (
        <ExportModalWrapper
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onGenerateReport={handleGenerateReport}
          managerName={selectedManager.name}
          aggregatedData={selectedManager.aggregatedData}
        />
      )}
    </>
  )
}
