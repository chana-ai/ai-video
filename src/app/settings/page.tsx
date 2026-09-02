"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Application settings and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings page coming soon...</p>
          <Button className="mt-4">Back to Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )
}