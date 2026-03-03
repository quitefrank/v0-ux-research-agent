export interface Source {
  id: number
  name: string
  base_url: string
  enabled: boolean
  crawl_depth: number
  include_patterns?: string
  exclude_patterns?: string
  tags: string[]
  notes?: string
  last_indexed?: string
}

export interface IndexedPage {
  id: number
  source_id: string
  url: string
  title?: string
  indexed_at: string
}

export interface Citation {
  url: string
  title: string
}

export interface Evidence {
  claim: string
  citations: Citation[]
}

export interface Example {
  source: string
  pattern_tags: string[]
  links: Citation[]
}

export interface Option {
  title: string
  description: string
  pros?: string[]
  cons?: string[]
}

export interface RunResult {
  summary: string
  evidence: Evidence[]
  examples: Example[]
  options: Option[]
  markdown: string
}

export interface Run {
  id: number
  query: string
  platform?: string
  pattern_type?: string
  product_category?: string
  created_at: string
  result?: RunResult
}

export interface IndexResult {
  source_name: string
  pages_added: number
  pages_updated: number
  status: "success" | "error"
  error?: string
}
