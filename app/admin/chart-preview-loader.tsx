"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import our components to avoid affecting the initial page load
const ChartPreviewIntegration = dynamic(
  () => import("./chart-preview-integration").then((mod) => mod.ChartPreviewIntegration),
  {
    ssr: false,
  },
)

const ChartPreviewScript = dynamic(() => import("./chart-preview-script").then((mod) => mod.ChartPreviewScript), {
  ssr: false,
})

export function ChartPreviewLoader() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Wait a bit to ensure the admin page is fully loaded
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) return null

  return (
    <>
      <ChartPreviewIntegration />
      <ChartPreviewScript />
    </>
  )
}
