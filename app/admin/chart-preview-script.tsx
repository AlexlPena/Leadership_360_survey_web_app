"use client"

import { useEffect } from "react"

// This script injects our chart preview functionality into the existing admin page
export function ChartPreviewScript() {
  useEffect(() => {
    // Wait for the page to fully load
    const injectScript = () => {
      // Find all export buttons
      const exportButtons = document.querySelectorAll('[title="Export data"]')

      // Add click event listeners to intercept the export button clicks
      exportButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          // Get the manager data from the row
          const row = (button as HTMLElement).closest("tr")
          if (!row) return

          // Get manager name from the row
          const nameCell = row.querySelector("td:nth-child(2)")
          const managerName = nameCell?.textContent || "Unknown Manager"

          // Get the aggregated data from the global window object
          // This is a hack, but it's the only way to get the data without modifying the existing code
          const managerId = row.getAttribute("data-manager-id")
          const managers = (window as any).__managers || []
          const manager = managers.find((m: any) => m.managerId === managerId)

          if (manager?.aggregatedData) {
            // Dispatch a custom event with the manager data
            const event = new CustomEvent("exportManager", {
              detail: {
                managerName,
                aggregatedData: manager.aggregatedData,
              },
              bubbles: true,
              cancelable: true,
            })
            button.dispatchEvent(event)

            // Prevent the default click behavior
            e.preventDefault()
            e.stopPropagation()
          }
        })
      })

      // Listen for the document form open event
      window.addEventListener("openDocumentForm", (e: any) => {
        // Find the original "Generate Leadership Assessment Report" button and click it
        const reportButtons = Array.from(document.querySelectorAll("button")).filter((btn) =>
          btn.textContent?.includes("Generate Leadership Assessment Report"),
        )
        if (reportButtons.length > 0) {
          reportButtons[0].click()
        }
      })
    }

    // Run the injection after a short delay to ensure the page is loaded
    setTimeout(injectScript, 1000)

    // Also run it when the page content might have changed
    const observer = new MutationObserver((mutations) => {
      setTimeout(injectScript, 500)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
