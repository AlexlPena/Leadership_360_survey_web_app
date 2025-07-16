import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UsersIcon, UserCog, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Leadership 360 Assessment Platform</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive leadership evaluation tools to help develop and strengthen leadership capabilities across
              the organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {/* Self Assessment */}
            <Card className="border-l-4 border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  Self Assessment
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Evaluate your own leadership competencies and behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Reflect on your leadership practices across key competencies and identify areas for personal growth
                  and development.
                </p>
                <Link href="/supervisor-survey" className="w-full">
                  <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                    Start Self Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Peer & Colleague Assessment */}
            <Card className="border-l-4 border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Users className="h-5 w-5 text-blue-500" />
                  Peer & Colleague Assessment
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Provide feedback on your colleague's leadership effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Evaluate a peer's leadership competencies and provide constructive feedback to help them develop their
                  leadership skills.
                </p>
                <Link href="/employee-survey" className="w-full">
                  <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                    Start Peer & Colleague Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Direct Report Assessment */}
            <Card className="border-l-4 border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                  Direct Report Assessment
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Evaluate leadership from a direct report perspective
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Provide feedback on how leadership practices impact you directly and suggest areas for improvement.
                </p>
                <Link href="/director-survey" className="w-full">
                  <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                    Start Direct Report Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Manager Assessment */}
            <Card className="border-l-4 border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <UserCog className="h-5 w-5 text-blue-500" />
                  Manager Assessment
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Provide feedback about your manager's leadership effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Evaluate your manager's leadership competencies and provide insights to help them enhance their
                  leadership capabilities.
                </p>
                <Link href="/manager-survey" className="w-full">
                  <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                    Start Manager Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Admin Dashboard */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-l-4 border-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Crown className="h-5 w-5 text-blue-500" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Access administrative tools and view assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  View and analyze assessment results, manage surveys, and access administrative functions.
                </p>
                <Link href="/admin" className="w-full">
                  <Button variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                    Access Admin Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Centerfield. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
