import type { AdminSubmission } from "../types/admin"

export function exportToCSV(data: AdminSubmission[], filename: string) {
  const headers = ["ID", "Anonymous ID", "Manager Name", "Date Submitted", "Status", "Comments"]

  const csvContent = [
    headers.join(","),
    ...data.map((submission) =>
      [
        submission.id,
        submission.anonymousId,
        submission.managerName,
        submission.submittedAt.toISOString().split("T")[0],
        submission.status,
        `"${(submission.comments || "").replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(data: AdminSubmission[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
