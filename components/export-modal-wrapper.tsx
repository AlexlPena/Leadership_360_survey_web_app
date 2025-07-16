"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExportOptions } from "./export-options"
import type { AggregatedSubmission } from "@/types/survey"

interface ExportModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  onGenerateReport: () => void
  managerName?: string
  aggregatedData: AggregatedSubmission | null
}

export function ExportModalWrapper({
  isOpen,
  onClose,
  onGenerateReport,
  managerName = "",
  aggregatedData,
}: ExportModalWrapperProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>

        <ExportOptions managerName={managerName} aggregatedData={aggregatedData} onGenerateReport={onGenerateReport} />

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
