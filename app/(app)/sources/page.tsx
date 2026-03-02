import { getSources } from "@/lib/db"
import { SourcesTable } from "@/components/sources-table"

export default function SourcesPage() {
  const sources = getSources()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Research Sources</h1>
        <p className="text-sm text-muted-foreground">
          Manage the knowledge base that powers your research. Add sources, adjust crawl depth, and re-index.
        </p>
      </div>
      <SourcesTable sources={sources} />
    </div>
  )
}
