import { TestDataGenerator } from "@/components/test-data-generator"
import { ProtectedRoute } from "@/components/protected-route"

export default function DevToolsPage() {
  return (
    <ProtectedRoute type="admin">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Development Tools</h1>

        <div className="grid gap-6">
          <TestDataGenerator />
        </div>
      </div>
    </ProtectedRoute>
  )
}
