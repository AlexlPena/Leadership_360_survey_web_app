import type { AggregatedSubmission } from "@/types/survey"
import { generateComparisonChartBase64 } from "./chart-generator"

// Function to generate a preview URL for the comparison chart
export async function generateChartPreview(data: AggregatedSubmission): Promise<string> {
  try {
    // Use the existing function to generate the base64 data
    const base64Data = await generateComparisonChartBase64(data)

    // Convert the base64 data to a data URL that can be displayed in an <img> tag
    return `data:image/png;base64,${base64Data}`
  } catch (error) {
    console.error("Error generating chart preview:", error)
    throw error
  }
}
