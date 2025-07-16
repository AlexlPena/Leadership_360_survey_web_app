"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { sessionManager } from "../lib/password-store"
import { useRouter } from "next/navigation"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function LogoutButton({ variant = "ghost", size = "sm", className }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = () => {
    sessionManager.clearAuthentication()
    router.push("/")
    router.refresh()
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
