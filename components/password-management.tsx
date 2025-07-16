"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Key, Shield, Clock } from "lucide-react"

export function PasswordManagement() {
  const [passwords, setPasswords] = useState({
    employee: "employee123",
    supervisor: "supervisor123",
    admin: "admin123",
  })
  const [newPasswords, setNewPasswords] = useState({
    employee: "",
    supervisor: "",
    admin: "",
  })
  const [sessionTimeout, setSessionTimeout] = useState("24")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handlePasswordChange = (type: keyof typeof passwords, value: string) => {
    setNewPasswords((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const handleUpdatePassword = (type: keyof typeof passwords) => {
    if (!newPasswords[type]) {
      setErrorMessage(`Please enter a new password for ${type} access`)
      setTimeout(() => setErrorMessage(""), 3000)
      return
    }

    // In a real app, this would call an API to update the password
    setPasswords((prev) => ({
      ...prev,
      [type]: newPasswords[type],
    }))
    setNewPasswords((prev) => ({
      ...prev,
      [type]: "",
    }))
    setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} password updated successfully`)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleSessionTimeoutChange = (value: string) => {
    setSessionTimeout(value)
    setSuccessMessage("Session timeout updated successfully")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Employee Survey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="employee-password" className="text-xs">
                    Current Password
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="employee-password"
                      type="password"
                      value={newPasswords.employee}
                      onChange={(e) => handlePasswordChange("employee", e.target.value)}
                      placeholder={passwords.employee.replace(/./g, "•")}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleUpdatePassword("employee")}>
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Supervisor Survey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="supervisor-password" className="text-xs">
                    Current Password
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="supervisor-password"
                      type="password"
                      value={newPasswords.supervisor}
                      onChange={(e) => handlePasswordChange("supervisor", e.target.value)}
                      placeholder={passwords.supervisor.replace(/./g, "•")}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleUpdatePassword("supervisor")}>
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Admin Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-xs">
                    Current Password
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="admin-password"
                      type="password"
                      value={newPasswords.admin}
                      onChange={(e) => handlePasswordChange("admin", e.target.value)}
                      placeholder={passwords.admin.replace(/./g, "•")}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleUpdatePassword("admin")}>
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Session Timeout
                  </Label>
                  <p className="text-xs text-gray-600">Automatically log out users after inactivity</p>
                </div>
                <Select value={sessionTimeout} onValueChange={handleSessionTimeoutChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Password Requirements</Label>
                  <p className="text-xs text-gray-600">Minimum password length and complexity</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
