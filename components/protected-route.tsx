"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { PasswordEntry } from "./password-entry"
import { passwordStore, sessionManager } from "../lib/password-store"

interface ProtectedRouteProps {
  children: React.ReactNode
  type: "admin" | "employee" | "supervisor" | "director" | "manager"
  title: string
  description: string
}

export function ProtectedRoute({ children, type, title, description }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = sessionManager.isAuthenticated(type)
    setIsAuthenticated(authenticated)
    setIsLoading(false)
  }, [type])

  const handlePasswordSuccess = () => {
    sessionManager.setAuthenticated(type)
    setIsAuthenticated(true)
  }

  const handleVerifyPassword = (password: string): boolean => {
    // For demo purposes, accept any non-empty password
    // In production, this would verify against the stored password
    return passwordStore.verifyPasswordDemo(password)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <PasswordEntry
        title={title}
        description={description}
        onSuccess={handlePasswordSuccess}
        onVerifyPassword={handleVerifyPassword}
        type={type}
      />
    )
  }

  return <>{children}</>
}
