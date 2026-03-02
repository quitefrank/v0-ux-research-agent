import type { Source, IndexedPage, Run } from "./types"

// In-memory store (persists across requests in development, resets on deploy)
const store: {
  sources: Source[]
  indexedPages: IndexedPage[]
  runs: Run[]
} = {
  sources: [
    {
      id: "src-1",
      name: "Nielsen Norman Group",
      base_url: "https://www.nngroup.com",
      enabled: true,
      crawl_depth: 2,
      include_patterns: "/articles/*",
      tags: ["usability", "research", "heuristics"],
      notes: "Leading UX research and consulting group",
      last_indexed: "2026-02-28T10:00:00Z",
    },
    {
      id: "src-2",
      name: "Material Design",
      base_url: "https://m3.material.io",
      enabled: true,
      crawl_depth: 1,
      include_patterns: "/components/*,/foundations/*",
      tags: ["design-system", "android", "components"],
      notes: "Google's open-source design system",
      last_indexed: "2026-02-27T14:30:00Z",
    },
    {
      id: "src-3",
      name: "Apple Human Interface Guidelines",
      base_url: "https://developer.apple.com/design",
      enabled: true,
      crawl_depth: 2,
      include_patterns: "/human-interface-guidelines/*",
      tags: ["design-system", "ios", "apple"],
      notes: "Apple's design guidelines for all platforms",
      last_indexed: "2026-02-26T09:15:00Z",
    },
    {
      id: "src-4",
      name: "Baymard Institute",
      base_url: "https://baymard.com",
      enabled: false,
      crawl_depth: 1,
      tags: ["e-commerce", "checkout", "usability"],
      notes: "E-commerce UX research",
    },
    {
      id: "src-5",
      name: "Laws of UX",
      base_url: "https://lawsofux.com",
      enabled: true,
      crawl_depth: 0,
      tags: ["principles", "psychology", "patterns"],
      last_indexed: "2026-02-25T16:45:00Z",
    },
  ],
  indexedPages: [],
  runs: [],
}

// Sources
export function getSources(): Source[] {
  return [...store.sources]
}

export function getSource(id: string): Source | undefined {
  return store.sources.find((s) => s.id === id)
}

export function addSource(source: Omit<Source, "id">): Source {
  const newSource: Source = {
    ...source,
    id: `src-${Date.now()}`,
  }
  store.sources.push(newSource)
  return newSource
}

export function updateSource(id: string, updates: Partial<Source>): Source | undefined {
  const index = store.sources.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  store.sources[index] = { ...store.sources[index], ...updates }
  return store.sources[index]
}

export function deleteSource(id: string): boolean {
  const index = store.sources.findIndex((s) => s.id === id)
  if (index === -1) return false
  store.sources.splice(index, 1)
  return true
}

export function toggleSource(id: string): Source | undefined {
  const source = store.sources.find((s) => s.id === id)
  if (!source) return undefined
  source.enabled = !source.enabled
  return source
}

// Indexed Pages
export function getIndexedPages(sourceId?: string): IndexedPage[] {
  if (sourceId) {
    return store.indexedPages.filter((p) => p.source_id === sourceId)
  }
  return [...store.indexedPages]
}

export function upsertIndexedPages(pages: Omit<IndexedPage, "id">[]): IndexedPage[] {
  const result: IndexedPage[] = []
  for (const page of pages) {
    const existing = store.indexedPages.find(
      (p) => p.source_id === page.source_id && p.url === page.url
    )
    if (existing) {
      existing.indexed_at = page.indexed_at
      existing.title = page.title
      result.push(existing)
    } else {
      const newPage: IndexedPage = { ...page, id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
      store.indexedPages.push(newPage)
      result.push(newPage)
    }
  }
  return result
}

// Runs
export function getRuns(): Run[] {
  return [...store.runs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function getRun(id: string): Run | undefined {
  return store.runs.find((r) => r.id === id)
}

export function addRun(run: Omit<Run, "id" | "created_at">): Run {
  const newRun: Run = {
    ...run,
    id: `run-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  store.runs.push(newRun)
  return newRun
}
