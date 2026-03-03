"use server";

import { sql } from "@/lib/db";
import type { IndexResult, Run, Source } from "@/lib/types";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Path A (DB-backed) server actions.
 *
 * Tables expected (created by initDb somewhere):
 * - sources
 * - pages
 * - runs
 *
 * Notes:
 * - UI types use string IDs, but DB uses SERIAL ints.
 *   We cast id::text when returning to the UI.
 */

/** Optional helper: run this once to create all tables. */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS sources (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      crawl_depth INT NOT NULL DEFAULT 1,
      include_patterns TEXT,
      exclude_patterns TEXT,
      tags TEXT,
      notes TEXT,
      last_indexed_at TIMESTAMPTZ
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT,
      snippet TEXT,
      extracted_text TEXT,
      status TEXT NOT NULL DEFAULT 'ok',
      last_crawled_at TIMESTAMPTZ,
      content_hash TEXT,
      UNIQUE (source_id, url)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS runs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      query TEXT NOT NULL,
      platform TEXT,
      pattern_type TEXT,
      category TEXT,
      result_json JSONB NOT NULL
    );
  `;

  return { ok: true as const };
}

/* ----------------------------- SOURCES (DB) ----------------------------- */

export async function getSourcesDb(): Promise<Source[]> {
  const rows = await sql<{
    id: string;
    name: string;
    base_url: string;
    enabled: boolean;
    crawl_depth: number;
    include_patterns: string | null;
    exclude_patterns: string | null;
    tags: string | null;
    notes: string | null;
    last_indexed_at: string | null;
  }>`
    SELECT
      id::text AS id,
      name,
      base_url,
      enabled,
      crawl_depth,
      include_patterns,
      exclude_patterns,
      tags,
      notes,
      last_indexed_at::text AS last_indexed_at
    FROM sources
    ORDER BY id DESC;
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    base_url: r.base_url,
    enabled: r.enabled,
    crawl_depth: r.crawl_depth,
    include_patterns: r.include_patterns ?? undefined,
    exclude_patterns: r.exclude_patterns ?? undefined,
    tags: r.tags ?? undefined,
    notes: r.notes ?? undefined,
    last_indexed_at: r.last_indexed_at ?? undefined,
  }));
}

export async function createSourceDb(input: Omit<Source, "id">): Promise<Source> {
  const rows = await sql<{ id: string }>`
    INSERT INTO sources (
      name,
      base_url,
      enabled,
      crawl_depth,
      include_patterns,
      exclude_patterns,
      tags,
      notes
    )
    VALUES (
      ${input.name},
      ${input.base_url},
      ${input.enabled},
      ${input.crawl_depth},
      ${input.include_patterns ?? null},
      ${input.exclude_patterns ?? null},
      ${input.tags ?? null},
      ${input.notes ?? null}
    )
    RETURNING id::text AS id;
  `;

  return { ...input, id: rows[0]!.id };
}

export async function updateSourceDb(input: Source): Promise<Source> {
  await sql`
    UPDATE sources
    SET
      name = ${input.name},
      base_url = ${input.base_url},
      enabled = ${input.enabled},
      crawl_depth = ${input.crawl_depth},
      include_patterns = ${input.include_patterns ?? null},
      exclude_patterns = ${input.exclude_patterns ?? null},
      tags = ${input.tags ?? null},
      notes = ${input.notes ?? null}
    WHERE id = ${Number(input.id)};
  `;
  return input;
}

export async function deleteSourceDb(id: string): Promise<{ ok: true }> {
  await sql`DELETE FROM sources WHERE id = ${Number(id)};`;
  return { ok: true };
}

export async function toggleSourceDb(id: string, enabled: boolean): Promise<{ ok: true }> {
  await sql`
    UPDATE sources
    SET enabled = ${enabled}
    WHERE id = ${Number(id)};
  `;
  return { ok: true };
}

/* -------------------------- SOURCE ACTION WRAPPERS -------------------------- */
/** These are what your client components import and call. */

export async function addSourceAction(_prevState: any, formData: FormData) {
  const source: Omit<Source, "id"> = {
    name: String(formData.get("name") ?? "").trim(),
    base_url: String(formData.get("base_url") ?? "").trim(),
    enabled: String(formData.get("enabled") ?? "true") === "true",
    crawl_depth: Number(formData.get("crawl_depth") ?? 1),
    include_patterns: (String(formData.get("include_patterns") ?? "").trim() || undefined) as any,
    exclude_patterns: (String(formData.get("exclude_patterns") ?? "").trim() || undefined) as any,
    tags: (String(formData.get("tags") ?? "").trim() || undefined) as any,
    notes: (String(formData.get("notes") ?? "").trim() || undefined) as any,
    last_indexed_at: undefined,
  };

  if (!source.name || !source.base_url) {
    return { ok: false as const, error: "Name and Base URL are required." };
  }

  await createSourceDb(source);
  revalidatePath("/sources");
  return { ok: true as const };
}

export async function updateSourceAction(_prevState: any, formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  const source: Source = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    base_url: String(formData.get("base_url") ?? "").trim(),
    enabled: String(formData.get("enabled") ?? "true") === "true",
    crawl_depth: Number(formData.get("crawl_depth") ?? 1),
    include_patterns: (String(formData.get("include_patterns") ?? "").trim() || undefined) as any,
    exclude_patterns: (String(formData.get("exclude_patterns") ?? "").trim() || undefined) as any,
    tags: (String(formData.get("tags") ?? "").trim() || undefined) as any,
    notes: (String(formData.get("notes") ?? "").trim() || undefined) as any,
    last_indexed_at: undefined,
  };

  if (!source.id || !source.name || !source.base_url) {
    return { ok: false as const, error: "Missing required fields." };
  }

  await updateSourceDb(source);
  revalidatePath("/sources");
  return { ok: true as const };
}

export async function deleteSourceAction(id: string) {
  await deleteSourceDb(id);
  revalidatePath("/sources");
  return { ok: true as const };
}

export async function toggleSourceAction(id: string, enabled: boolean) {
  await toggleSourceDb(id, enabled);
  revalidatePath("/sources");
  return { ok: true as const };
}

/* ----------------------------- INDEXING (DB) ----------------------------- */

export async function indexSources(sources: Source[]): Promise<IndexResult[]> {
  // Minimal “Path A” behavior: mark sources as indexed.
  // Crawling + extraction can be added later.
  const now = new Date().toISOString();

  const results: IndexResult[] = [];

  for (const s of sources) {
    if (!s.enabled) {
      results.push({
        sourceId: s.id,
        pagesIndexed: 0,
        errors: ["Source disabled"],
      });
      continue;
    }

    await sql`
      UPDATE sources
      SET last_indexed_at = now()
      WHERE id = ${Number(s.id)};
    `;

    results.push({
      sourceId: s.id,
      pagesIndexed: 0,
      errors: [],
    });
  }

  revalidatePath("/sources");
  return results;
}

/* ----------------------------- RUNS (DB) ----------------------------- */

export async function getRunsDb(limit = 20): Promise<Run[]> {
  const rows = await sql<{
    id: string;
    created_at: string;
    query: string;
    platform: string | null;
    pattern_type: string | null;
    category: string | null;
    result_json: any;
  }>`
    SELECT
      id::text AS id,
      created_at::text AS created_at,
      query,
      platform,
      pattern_type,
      category,
      result_json
    FROM runs
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;

  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    query: r.query,
    platform: r.platform ?? undefined,
    pattern_type: r.pattern_type ?? undefined,
    product_category: r.category ?? undefined,
    result: r.result_json,
  }));
}

export async function getRunDb(id: string): Promise<Run | null> {
  const rows = await sql<{
    id: string;
    created_at: string;
    query: string;
    platform: string | null;
    pattern_type: string | null;
    category: string | null;
    result_json: any;
  }>`
    SELECT
      id::text AS id,
      created_at::text AS created_at,
      query,
      platform,
      pattern_type,
      category,
      result_json
    FROM runs
    WHERE id = ${Number(id)}
    LIMIT 1;
  `;

  if (rows.length === 0) return null;

  const r = rows[0]!;
  return {
    id: r.id,
    created_at: r.created_at,
    query: r.query,
    platform: r.platform ?? undefined,
    pattern_type: r.pattern_type ?? undefined,
    product_category: r.category ?? undefined,
    result: r.result_json,
  };
}

/**
 * Server Action called by <ResearchForm />.
 * Inserts a run row, then redirects to /run/:id.
 */
export async function runResearch(_prevState: any, formData: FormData) {
  const query = String(formData.get("query") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim() || null;
  const pattern_type = String(formData.get("pattern_type") ?? "").trim() || null;
  const category = String(formData.get("product_category") ?? "").trim() || null;

  if (!query) {
    return { ok: false as const, error: "Please enter a research query." };
  }

  // Placeholder result until you wire an AI provider + crawling.
  const result_json = {
    status: "stub",
    summary: "Research execution is not yet connected to a crawler or AI provider.",
    query,
    platform,
    pattern_type,
    category,
    created_at: new Date().toISOString(),
  };

  const rows = await sql<{ id: string }>`
    INSERT INTO runs (query, platform, pattern_type, category, result_json)
    VALUES (${query}, ${platform}, ${pattern_type}, ${category}, ${result_json}::jsonb)
    RETURNING id::text AS id;
  `;

  const id = rows[0]!.id;

  revalidatePath("/");
  redirect(`/run/${id}`);
}
