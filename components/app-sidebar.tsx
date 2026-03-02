"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Search, Database, Plus, FlaskConical } from "lucide-react"
import type { Run } from "@/lib/types"

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function AppSidebar({ runs }: { runs: Run[] }) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FlaskConical className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">UX Research</span>
            <span className="text-[11px] text-muted-foreground leading-tight">Agent</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <Plus className="h-4 w-4" />
                    <span>New Research</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/sources"}>
                  <Link href="/sources">
                    <Database className="h-4 w-4" />
                    <span>Sources</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Search className="h-3 w-3" />
            Recent Runs
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {runs.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  No research runs yet. Start by asking a question.
                </div>
              ) : (
                runs.map((run) => (
                  <SidebarMenuItem key={run.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/run/${run.id}`}
                      className="h-auto py-2"
                    >
                      <Link href={`/run/${run.id}`}>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="truncate text-sm">{run.query}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(run.created_at)}
                            {run.platform && ` \u00b7 ${run.platform}`}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Mock data mode - connect an AI provider for live results
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
