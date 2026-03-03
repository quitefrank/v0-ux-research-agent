"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

/**
 * Notes:
 * - This file is the server-actions façade that the client components import.
 * - It is DB-backed (Path A). If DATABASE_URL is misconfigured, these will fail at runtime.
 */

function toInt(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  return value === "true" || value === "1" || value === "on";
}

function safeText(value: unknown) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function stripHtmlToText(html: string) {
  // very simple extraction for MVP
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ============== DB INIT ============== */
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

  return { ok: true };
}

/** ============== SOURCES ============== */
export async function getSourcesDb() {
  const rows = await sql<{
    id: number;
    name: string;
    base_url: string;
    enabled: boolean;
    crawl_depth: number;
    include_patterns: string | null;
    exclude_patterns: string | null;
    tags: string | null;
    notes: string | null;
    last_indexed_at: string | null;
  }[]>`
    SELECT
      id, name, base_url, enabled, crawl_depth,
      include_patterns, exclude_patterns, tags, notes, last_indexed_at
    FROM sources
    ORDER BY id DESC;
  `;

  // map to what your UI expects (string ids)
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    base_url: r.base_url,
    enabled: r.enabled,
    crawl_depth: r.crawl_depth,
    include_patterns: r.include_patterns ?? "",
    exclude_patterns: r.exclude_patterns ?? "",
    tags: r.tags ?? "",
    notes: r.notes ?? "",
    last_indexed_at: r.last_indexed_at ? new Date(r.last_indexed_at).toISOString() : null,
  }));
}

export async function createSourceDb(input: {
  name: string;
  base_url: string;
  enabled: boolean;
  crawl_depth: number;
  include_patterns?: string;
  exclude_patterns?: string;
  tags?: string;
  notes?: string;
}) {
  const rows = await sql<{ id: number }[]>`
    INSERT INTO sources (name, base_url, enabled, crawl_depth, include_patterns, exclude_patterns, tags, notes)
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
    RETURNING id;
  `;
  return { id: String(rows[0]!.id) };
}

export async function updateSourceDb(
  id: string,
  input: Partial<{
    name: string;
    base_url: string;
    enabled: boolean;
    crawl_depth: number;
    include_patterns: string;
    exclude_patterns: string;
    tags: string;
    notes: string;
  }>
) {
  const sourceId = toInt(id, -1);
  if (sourceId <= 0) throw new Error("Invalid source id");

  // Build a safe "patch" using COALESCE-style updates.
  await sql`
    UPDATE sources
    SET
      name = COALESCE(${input.name ?? null}, name),
      base_url = COALESCE(${input.base_url ?? null}, base_url),
      enabled = COALESCE(${typeof input.enabled === "boolean" ? input.enabled : null}, enabled),
      crawl_depth = COALESCE(${typeof input.crawl_depth === "number" ? input.crawl_depth : null}, crawl_depth),
      include_patterns = COALESCE(${input.include_patterns ?? null}, include_patterns),
      exclude_patterns = COALESCE(${input.exclude_patterns ?? null}, exclude_patterns),
      tags = COALESCE(${input.tags ?? null}, tags),
      notes = COALESCE(${input.notes ?? null}, notes)
    WHERE id = ${sourceId};
  `;

  return { ok: true };
}

export async function deleteSourceDb(id: string) {
  const sourceId = toInt(id, -1);
  if (sourceId <= 0) throw new Error("Invalid source id");
  await sql`DELETE FROM sources WHERE id = ${sourceId};`;
  return { ok: true };
}

export async function toggleSourceDb(id: string, enabled: boolean) {
  const sourceId = toInt(id, -1);
  if (sourceId <= 0) throw new Error("Invalid source id");
  await sql`UPDATE sources SET enabled = ${enabled} WHERE id = ${sourceId};`;
  return { ok: true };
}

/** Server-actions consumed by client components */
export async function addSourceAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();

  if (!name) return { ok: false, error: "Name is required" };
  if (!baseUrl) return { ok: false, error: "Base URL is required" };

  const enabled = toBool(formData.get("enabled"), true);
  const crawlDepth = toInt(formData.get("crawl_depth"), 1);

  const includePatterns = String(formData.get("include_patterns") ?? "");
  const excludePatterns = String(formData.get("exclude_patterns") ?? "");
  const tags = String(formData.get("tags") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await createSourceDb({
    name,
    base_url: baseUrl,
    enabled,
    crawl_depth: crawlDepth,
    include_patterns: includePatterns,
    exclude_patterns: excludePatterns,
    tags,
    notes,
  });

  revalidatePath("/sources");
  return { ok: true };
}

export async function updateSourceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing source id" };

  const patch = {
    name: safeText(formData.get("name")) ?? undefined,
    base_url: safeText(formData.get("base_url")) ?? undefined,
    enabled: typeof formData.get("enabled") === "string" ? toBool(formData.get("enabled"), true) : undefined,
    crawl_depth: typeof formData.get("crawl_depth") === "string" ? toInt(formData.get("crawl_depth"), 1) : undefined,
    include_patterns: safeText(formData.get("include_patterns")) ?? undefined,
    exclude_patterns: safeText(formData.get("exclude_patterns")) ?? undefined,
    tags: safeText(formData.get("tags")) ?? undefined,
    notes: safeText(formData.get("notes")) ?? undefined,
  };

  await updateSourceDb(id, patch);
  revalidatePath("/sources");
  return { ok: true };
}

export async function deleteSourceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing source id" };

  await deleteSourceDb(id);
  revalidatePath("/sources");
  return { ok: true };
}

export async function toggleSourceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const enabled = toBool(formData.get("enabled"), false);

  if (!id) return { ok: false, error: "Missing source id" };

  await toggleSourceDb(id, enabled);
  revalidatePath("/sources");
  return { ok: true };
}

/** ============== INDEXING (MVP) ============== */
export async function indexSources(): Promise<{ ok: boolean; results: Array<{ sourceId: string; pagesIndexed: number; errors: string[] }> }> {
  const sources = await getSourcesDb();
  const enabledSources = sources.filter((s) => s.enabled);

  const results: Array<{ sourceId: string; pagesIndexed: number; errors: string[] }> = [];

  for (const source of enabledSources) {
    const errors: string[] = [];
    let pagesIndexed = 0;

    try {
      // MVP: fetch just the base_url and store one "page" record
      const res = await fetch(source.base_url, { redirect: "follow" });
      if (!res.ok) {
        errors.push(`Fetch failed (${res.status}) for ${source.base_url}`);
      } else {
        const html = await res.text();
        const text = stripHtmlToText(html);
        const snippet = text.slice(0, 240);

        const sourceId = toInt(source.id, -1);
        if (sourceId > 0) {
          await sql`
            INSERT INTO pages (source_id, url, title, snippet, extracted_text, status, last_crawled_at)
            VALUES (${sourceId}, ${source.base_url}, ${source.name}, ${snippet}, ${text}, 'ok', now())
            ON CONFLICT (source_id, url)
            DO UPDATE SET
              title = EXCLUDED.title,
              snippet = EXCLUDED.snippet,
              extracted_text = EXCLUDED.extracted_text,
              status = 'ok',
              last_crawled_at = now();
          `;

          await sql`UPDATE sources SET last_indexed_at = now() WHERE id = ${sourceId};`;
          pagesIndexed = 1;
        } else {
          errors.push("Invalid source id");
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }

    results.push({ sourceId: source.id, pagesIndexed, errors });
  }

  revalidatePath("/sources");
  return { ok: true, results };
}

/** ============== RESEARCH ============== */
export async function runResearch(
  _prevState: any,
  formData: FormData
): Promise<
  | { ok: true; runId: string; result: any }
  | { ok: false; error: string }
> {
  const query = String(formData.get("query") ?? "").trim();
  if (!query) return { ok: false, error: "Query is required" };

  // Optional metadata fields from the UI (these are in your types and UI)
  const platform = safeText(formData.get("platform")) ?? null;
  const patternType = safeText(formData.get("pattern_type")) ?? null;
  const category = safeText(formData.get("category")) ?? null;

  // MVP “search”: pull top matching pages from pages.extracted_text/snippet/url
  const rows = await sql<{
    url: string;
    title: string | null;
    snippet: string | null;
    extracted_text: string | null;
  }[]>`
    SELECT url, title, snippet, extracted_text
    FROM pages
    WHERE extracted_text ILIKE ${"%" + query + "%"}
       OR snippet ILIKE ${"%" + query + "%"}
       OR url ILIKE ${"%" + query + "%"}
    ORDER BY id DESC
    LIMIT 10;
  `;

  const sources = rows.map((r) => ({
    title: r.title ?? r.url,
    url: r.url,
    snippet: r.snippet ?? (r.extracted_text ? r.extracted_text.slice(0, 240) : ""),
  }));

  // This result shape just needs to satisfy your UI renderer (RunResultTabs).
  // Keep it simple for MVP.
  const result = {
    answer: sources.length
      ? `Found ${sources.length} relevant page(s) in your indexed sources for: "${query}".`
      : `No indexed pages matched "${query}". Try indexing sources first, or broaden the query.`,
    insights: sources.length
      ? [
          "This is an MVP search over indexed text stored in the database.",
          "Improve indexing to crawl deeper pages and store better extracted_text.",
        ]
      : [
          "Indexing likely has not been run yet, or the sources contain no matching text.",
          "Add sources, click Index Sources, then re-run the query.",
        ],
    sources,
  };

  const inserted = await sql<{ id: number }[]>`
    INSERT INTO runs (query, platform, pattern_type, category, result_json)
    VALUES (${query}, ${platform}, ${patternType}, ${category}, ${JSON.stringify(result)}::jsonb)
    RETURNING id;
  `;

  const runId = String(inserted[0]!.id);
  return { ok: true, runId, result };
}

/** Used by /run/[id] page */
export async function getRunDb(id: string) {
  const runId = toInt(id, -1);
  if (runId <= 0) return null;

  const rows = await sql<{
    id: number;
    created_at: string;
    query: string;
    platform: string | null;
    pattern_type: string | null;
    category: string | null;
    result_json: any;
  }[]>`
    SELECT id, created_at, query, platform, pattern_type, category, result_json
    FROM runs
    WHERE id = ${runId}
    LIMIT 1;
  `;

  const r = rows[0];
  if (!r) return null;

  return {
    id: String(r.id),
    created_at: new Date(r.created_at).toISOString(),
    query: r.query,
    platform: r.platform ?? undefined,
    pattern_type: r.pattern_type ?? undefined,
    product_category: r.category ?? undefined, // your UI uses product_category label
    result: r.result_json,
  };
}
