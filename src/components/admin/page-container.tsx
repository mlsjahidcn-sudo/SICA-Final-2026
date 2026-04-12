"use client"

import { ReactNode } from "react"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

interface PageContainerProps {
  children: ReactNode
  title?: string
  sidebarVariant?: "inset" | "floating" | "sidebar"
}

/**
 * Reusable page container with sidebar layout for admin pages
 * Eliminates the need to repeat sidebar, header, and layout code in every page
 */
export function PageContainer({ 
  children, 
  title,
  sidebarVariant = "inset" 
}: PageContainerProps) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant={sidebarVariant} />
        <SidebarInset>
          <SiteHeader title={title} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
