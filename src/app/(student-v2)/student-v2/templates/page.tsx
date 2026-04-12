"use client"

import * as React from "react"
import { TemplateManager } from "@/components/student-v2/template-manager"

export default function TemplatesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable templates for your applications
          </p>
        </div>
      </div>

      <TemplateManager />
    </div>
  )
}
