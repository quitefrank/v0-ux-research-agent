import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { getRuns } from "@/lib/store"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // In Path A, layout reads from the mock store (sync) and actions handle mutations.
  const runs = getRuns()

  // Defensive: prevents build-time crashes if runs is ever not an array.
  const safeRuns = Array.isArray(runs) ? runs : []

  return (
    <SidebarProvider>
      <AppSidebar runs={safeRuns} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground font-medium">UX Research Agent</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
