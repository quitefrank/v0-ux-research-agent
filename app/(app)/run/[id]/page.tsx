import { notFound } from "next/navigation"
import { getRun } from "@/lib/db"
import { RunResultTabs } from "@/components/run-result-tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const run = getRun(id)

  if (!run || !run.result) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to search
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground leading-snug text-balance">
            {run.query}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {run.platform && (
              <Badge variant="secondary">{run.platform}</Badge>
            )}
            {run.pattern_type && (
              <Badge variant="secondary">{run.pattern_type}</Badge>
            )}
            {run.product_category && (
              <Badge variant="secondary">{run.product_category}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(run.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <RunResultTabs result={run.result} />
    </div>
  )
}
