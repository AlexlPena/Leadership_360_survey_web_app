"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Settings, FileText, Home, Code } from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <BarChart3 className="h-5 w-5" /> },
    { name: "Submissions", href: "/admin/submissions", icon: <FileText className="h-5 w-5" /> },
    { name: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
    { name: "Dev Tools", href: "/admin/dev-tools", icon: <Code className="h-5 w-5" /> },
  ]

  return (
    <div
      className={`bg-white border-r h-screen ${collapsed ? "w-16" : "w-64"} transition-all duration-300 flex flex-col`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && <h2 className="font-semibold text-lg">Admin Panel</h2>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-md hover:bg-gray-100">
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-md ${
                  isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Link href="/" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md">
          <Home className="h-5 w-5 mr-3" />
          {!collapsed && <span>Back to Home</span>}
        </Link>
      </div>
    </div>
  )
}
