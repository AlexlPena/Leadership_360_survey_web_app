interface PasswordData {
  adminPassword: string
  employeePassword: string
  supervisorPassword: string
  directorPassword: string
  managerPassword: string
}

class PasswordStore {
  private storageKey = "leadership-survey-passwords"

  private defaultPasswords: PasswordData = {
    adminPassword: "admin123",
    employeePassword: "employee123",
    supervisorPassword: "supervisor123",
    directorPassword: "director123",
    managerPassword: "manager123",
  }

  getPasswords(): PasswordData {
    if (typeof window === "undefined") return this.defaultPasswords

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return { ...this.defaultPasswords, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error("Error loading passwords:", error)
    }
    return this.defaultPasswords
  }

  savePasswords(passwords: PasswordData): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(passwords))
    } catch (error) {
      console.error("Error saving passwords:", error)
    }
  }

  verifyPassword(type: "admin" | "employee" | "supervisor" | "director" | "manager", password: string): boolean {
    const passwords = this.getPasswords()
    const key = `${type}Password` as keyof PasswordData
    return passwords[key] === password
  }

  verifyPasswordDemo(password: string): boolean {
    // For demo purposes, accept any non-empty password
    return password.trim().length > 0
  }
}

class SessionManager {
  private sessionKey = "leadership-survey-session"

  setAuthenticated(type: "admin" | "employee" | "supervisor" | "director" | "manager"): void {
    if (typeof window === "undefined") return

    try {
      const session = {
        type,
        timestamp: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    } catch (error) {
      console.error("Error setting session:", error)
    }
  }

  isAuthenticated(type: "admin" | "employee" | "supervisor" | "director" | "manager"): boolean {
    if (typeof window === "undefined") return false

    try {
      const stored = sessionStorage.getItem(this.sessionKey)
      if (!stored) return false

      const session = JSON.parse(stored)
      if (session.type !== type) return false
      if (Date.now() > session.expires) {
        this.clearAuthentication()
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking session:", error)
      return false
    }
  }

  getAuthenticationType(): string | null {
    if (typeof window === "undefined") return null

    try {
      const stored = sessionStorage.getItem(this.sessionKey)
      if (!stored) return null

      const session = JSON.parse(stored)
      if (Date.now() > session.expires) {
        this.clearAuthentication()
        return null
      }

      return session.type
    } catch (error) {
      console.error("Error getting session type:", error)
      return null
    }
  }

  clearAuthentication(): void {
    if (typeof window === "undefined") return

    try {
      sessionStorage.removeItem(this.sessionKey)
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }
}

export const passwordStore = new PasswordStore()
export const sessionManager = new SessionManager()
export type PasswordType = "admin" | "employee" | "supervisor" | "director" | "manager"
