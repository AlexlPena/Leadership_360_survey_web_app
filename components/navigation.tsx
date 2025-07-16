"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Users, UserCheck, Settings, UsersIcon, UserCog } from "lucide-react"
import { LogoutButton } from "./logout-button"
import { sessionManager } from "../lib/password-store"
import { useState, useEffect } from "react"

export function Navigation() {
  const pathname = usePathname()
  const [authType, setAuthType] = useState<string | null>(null)

  useEffect(() => {
    setAuthType(sessionManager.getAuthenticationType())
  }, [pathname])

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/employee-survey", label: "Peer Survey", icon: Users },
    { href: "/supervisor-survey", label: "Self Survey", icon: UserCheck },
    { href: "/director-survey", label: "Direct Survey", icon: UsersIcon },
    { href: "/manager-survey", label: "Manager Survey", icon: UserCog },
    { href: "/admin", label: "Admin", icon: Settings },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Centerfield%20Logo-Kg7ipOBmKoncLmYLYmKOqgNt7NVtau.png"
            alt="Centerfield Logo"
            width={150}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "default" : "ghost"} size="sm" className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}

          {authType && (
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600 capitalize">{authType}</span>
              <LogoutButton />
            </div>
          )}
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
