import { initDb } from "./actions";
import { getSources } from "@/lib/store"
import { SourcesTable } from "@/components/sources-table"

export default function SourcesPage() {
  const sources = getSources()

  return (
<form action={initDb}>
  <button
    type="submit"
    className="mb-4 rounded-md border px-3 py-2 text-sm"
  >
    Initialize Database
  </button>
</form>
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
