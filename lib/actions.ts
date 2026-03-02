"use server"

import {
  addSource as dbAddSource,
  updateSource as dbUpdateSource,
  deleteSource as dbDeleteSource,
  toggleSource as dbToggleSource,
  getSources,
  addRun,
  upsertIndexedPages,
} from "./db"
import type { RunResult, IndexResult } from "./types"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

function generateMockResult(query: string, platform?: string, patternType?: string): RunResult {
  const platformLabel = platform || "cross-platform"
  const patternLabel = patternType || "general UX"

  return {
    summary: `Based on analysis of leading UX research sources, ${query.toLowerCase()} is a well-studied area in ${patternLabel} design for ${platformLabel} applications.\n\nKey findings indicate that users consistently prefer interfaces that reduce cognitive load and provide clear visual hierarchies. Research from Nielsen Norman Group shows that progressive disclosure significantly improves task completion rates (up to 28% improvement). Material Design and Apple HIG both emphasize the importance of consistent interaction patterns, with studies showing a 35% reduction in user errors when standard platform conventions are followed.\n\nThe evidence strongly supports a layered approach: surface the most critical information first, then allow users to drill deeper as needed. This aligns with the principle of recognition over recall, one of the most validated heuristics in usability research.`,
    evidence: [
      {
        claim: "Progressive disclosure improves task completion rates by up to 28%",
        citations: [
          { url: "https://www.nngroup.com/articles/progressive-disclosure/", title: "Progressive Disclosure - NNGroup" },
          { url: "https://www.nngroup.com/articles/complex-ui/", title: "Simplicity vs. Feature Richness" },
        ],
      },
      {
        claim: "Following platform conventions reduces user errors by 35%",
        citations: [
          { url: "https://m3.material.io/foundations/interaction/states", title: "Interaction States - Material Design" },
          { url: "https://developer.apple.com/design/human-interface-guidelines/patterns", title: "Patterns - Apple HIG" },
        ],
      },
      {
        claim: "Recognition over recall is among the most validated usability heuristics",
        citations: [
          { url: "https://www.nngroup.com/articles/recognition-and-recall/", title: "Recognition vs. Recall - NNGroup" },
          { url: "https://lawsofux.com/hicks-law/", title: "Hick's Law - Laws of UX" },
        ],
      },
      {
        claim: "Visual hierarchy directs attention and reduces time to first meaningful interaction by 40%",
        citations: [
          { url: "https://www.nngroup.com/articles/visual-hierarchy/", title: "Visual Hierarchy in UI Design" },
          { url: "https://m3.material.io/foundations/layout/understanding-layout", title: "Understanding Layout - Material Design" },
        ],
      },
    ],
    examples: [
      {
        source: "Material Design 3",
        pattern_tags: ["navigation", "components", "layout"],
        links: [
          { url: "https://m3.material.io/components/navigation-bar/overview", title: "Navigation Bar" },
          { url: "https://m3.material.io/components/navigation-drawer/overview", title: "Navigation Drawer" },
        ],
      },
      {
        source: "Apple Human Interface Guidelines",
        pattern_tags: ["navigation", "ios", "tab-bar"],
        links: [
          { url: "https://developer.apple.com/design/human-interface-guidelines/tab-bars", title: "Tab Bars" },
          { url: "https://developer.apple.com/design/human-interface-guidelines/sidebars", title: "Sidebars" },
        ],
      },
      {
        source: "Nielsen Norman Group",
        pattern_tags: ["forms", "usability", "research"],
        links: [
          { url: "https://www.nngroup.com/articles/web-form-design/", title: "Web Form Design Best Practices" },
          { url: "https://www.nngroup.com/articles/errors-forms-design-guidelines/", title: "Error Design Guidelines" },
        ],
      },
    ],
    options: [
      {
        title: "Progressive Disclosure Pattern",
        description: "Show only essential information upfront, reveal complexity as users need it. Works well for forms, settings, and data-heavy interfaces.",
        pros: ["Reduces cognitive load", "Improves initial comprehension", "Scales well with complexity"],
        cons: ["May hide important features", "Requires careful information architecture", "Can frustrate power users"],
      },
      {
        title: "Hub and Spoke Navigation",
        description: "Central screen serves as the launch point with dedicated sub-screens for each task. Common in mobile apps and dashboard-style interfaces.",
        pros: ["Clear mental model", "Easy to add new sections", "Works across platforms"],
        cons: ["Extra taps to reach deep content", "Central hub can become cluttered", "Less efficient for frequent task-switching"],
      },
      {
        title: "Contextual Action Panels",
        description: "Actions and details appear in context (sheets, popovers, inline expansion) rather than navigating away. Keeps user oriented within their current task.",
        pros: ["Maintains user context", "Faster task completion", "Reduces navigation fatigue"],
        cons: ["Can feel cramped on mobile", "Requires careful z-index management", "May conflict with platform conventions"],
      },
    ],
    markdown: `# Research Summary: ${query}

## Overview
${query} is a well-studied area in ${patternLabel} design for ${platformLabel} applications.

## Key Findings

### Progressive Disclosure
Users consistently prefer interfaces that reduce cognitive load. Progressive disclosure improves task completion rates by **up to 28%** (NNGroup).

### Platform Conventions
Following standard platform conventions reduces user errors by **35%**. Both Material Design and Apple HIG emphasize consistent interaction patterns.

### Recognition Over Recall
Recognition-based interfaces outperform recall-based ones. This is among the most validated heuristics in usability research.

### Visual Hierarchy
Proper visual hierarchy reduces time to first meaningful interaction by **40%**.

## Recommended Approaches

1. **Progressive Disclosure** - Surface critical information first
2. **Hub and Spoke** - Central navigation with dedicated sub-screens
3. **Contextual Actions** - Keep actions in context with sheets and popovers

## Sources
- Nielsen Norman Group (nngroup.com)
- Material Design 3 (m3.material.io)
- Apple Human Interface Guidelines
- Laws of UX (lawsofux.com)
`,
  }
}

export async function runResearch(formData: FormData) {
  const query = formData.get("query") as string
  const platform = formData.get("platform") as string | null
  const patternType = formData.get("pattern_type") as string | null
  const productCategory = formData.get("product_category") as string | null

  if (!query?.trim()) {
    throw new Error("Query is required")
  }

  const result = generateMockResult(
    query,
    platform || undefined,
    patternType || undefined
  )

  const run = addRun({
    query: query.trim(),
    platform: platform || undefined,
    pattern_type: patternType || undefined,
    product_category: productCategory || undefined,
    result,
  })

  redirect(`/run/${run.id}`)
}

export async function indexSources(): Promise<IndexResult[]> {
  const sources = getSources().filter((s) => s.enabled)
  const results: IndexResult[] = []

  for (const source of sources) {
    const mockPageCount = Math.floor(Math.random() * 15) + 3
    const mockPages = Array.from({ length: mockPageCount }, (_, i) => ({
      source_id: source.id,
      url: `${source.base_url}/article-${i + 1}`,
      title: `${source.name} Article ${i + 1}`,
      indexed_at: new Date().toISOString(),
    }))

    upsertIndexedPages(mockPages)

    const { updateSource: dbUpdate } = await import("./db")
    dbUpdate(source.id, { last_indexed: new Date().toISOString() })

    results.push({
      source_name: source.name,
      pages_added: Math.floor(mockPageCount * 0.7),
      pages_updated: Math.floor(mockPageCount * 0.3),
      status: "success",
    })
  }

  revalidatePath("/sources")
  return results
}

export async function addSourceAction(formData: FormData) {
  const name = formData.get("name") as string
  const base_url = formData.get("base_url") as string
  const enabled = formData.get("enabled") === "on"
  const crawl_depth = parseInt(formData.get("crawl_depth") as string) || 1
  const include_patterns = formData.get("include_patterns") as string
  const exclude_patterns = formData.get("exclude_patterns") as string
  const tagsRaw = formData.get("tags") as string
  const notes = formData.get("notes") as string

  if (!name?.trim() || !base_url?.trim()) {
    throw new Error("Name and URL are required")
  }

  dbAddSource({
    name: name.trim(),
    base_url: base_url.trim(),
    enabled,
    crawl_depth,
    include_patterns: include_patterns?.trim() || undefined,
    exclude_patterns: exclude_patterns?.trim() || undefined,
    tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    notes: notes?.trim() || undefined,
  })

  revalidatePath("/sources")
}

export async function updateSourceAction(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const base_url = formData.get("base_url") as string
  const enabled = formData.get("enabled") === "on"
  const crawl_depth = parseInt(formData.get("crawl_depth") as string) || 1
  const include_patterns = formData.get("include_patterns") as string
  const exclude_patterns = formData.get("exclude_patterns") as string
  const tagsRaw = formData.get("tags") as string
  const notes = formData.get("notes") as string

  if (!id || !name?.trim() || !base_url?.trim()) {
    throw new Error("ID, Name, and URL are required")
  }

  dbUpdateSource(id, {
    name: name.trim(),
    base_url: base_url.trim(),
    enabled,
    crawl_depth,
    include_patterns: include_patterns?.trim() || undefined,
    exclude_patterns: exclude_patterns?.trim() || undefined,
    tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    notes: notes?.trim() || undefined,
  })

  revalidatePath("/sources")
}

export async function deleteSourceAction(id: string) {
  dbDeleteSource(id)
  revalidatePath("/sources")
}

export async function toggleSourceAction(id: string) {
  dbToggleSource(id)
  revalidatePath("/sources")
}
