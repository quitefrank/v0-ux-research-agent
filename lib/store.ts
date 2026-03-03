import { sql } from "@/lib/db"
import type { Source, Run } from "@/lib/types"

function parseJsonArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      // fallback: comma separated
      return value.split(",").map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

export async function getSources(): Promise<Source[]> {
  const rows = await sql<{
    id: number
    name: string
    base_url: string
    enabled: boolean
    crawl_depth: number
    include_patterns: string | null
    exclude_patterns: string | null
    tags: string | null
    notes: string | null
    last_indexed_at: string | null
  }>`
    SELECT *
    FROM sources
    ORDER BY id ASC;
  `

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    baseUrl: r.base_url,
    enabled: r.enabled,
    crawlDepth: r.crawl_depth,
    includePatterns: parseJsonArray(r.include_patterns),
    excludePatterns: parseJsonArray(r.exclude_patterns),
    tags: parseJsonArray(r.tags),
    notes: r.notes ?? undefined,
    lastIndexedAt: r.last_indexed_at ?? undefined,
  }))
}

export async function getRuns(): Promise<Run[]> {
  const rows = await sql<{
    id: number
    created_at: string
    query: string
    platform: string | null
    pattern_type: string | null
    category: string | null
    result_json: any
  }>`
    SELECT *
    FROM runs
    ORDER BY created_at DESC
    LIMIT 20;
  `

  return rows.map(r => ({
    id: r.id,
    createdAt: r.created_at,
    query: r.query,
    platform: r.platform ?? "",
    patternType: r.pattern_type ?? "",
    category: r.category ?? "",
    resultJson: r.result_json,
  }))
}

export async function addRun(run: Omit<Run, "id">): Promise<void> {
  await sql`
    INSERT INTO runs (created_at, query, platform, pattern_type, category, result_json)
    VALUES (${run.createdAt}, ${run.query}, ${run.platform}, ${run.patternType}, ${run.category}, ${run.resultJson}::jsonb);
  `
}
