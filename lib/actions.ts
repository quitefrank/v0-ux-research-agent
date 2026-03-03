"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type SourceRow = {
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
};

function toErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Initializes the database schema.
 * Intended to be run once per environment (Preview, Production).
 */
export async function initDb(): Promise<ActionResult<{ created: boolean }>> {
  try {
    // Basic connectivity check and a clearer error if DATABASE_URL is missing.
    // If DATABASE_URL is missing, your current lib/db.ts will throw before this runs.
    await sql`SELECT 1`;

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

    // Optional, but helpful indexes for typical queries.
    await sql`CREATE INDEX IF NOT EXISTS idx_pages_source_id ON pages(source_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);`;

    revalidatePath("/sources");
    return { ok: true, data: { created: true } };
  } catch (err) {
    return {
      ok: false,
      error:
        "initDb failed: " +
        toErrorMessage(err) +
        " | Check Vercel env vars: DATABASE_URL must be set for the current environment.",
    };
  }
}

/**
 * Fetch sources from Postgres.
 */
export async function getSourcesDb(): Promise<ActionResult<SourceRow[]>> {
  try {
    const rows = await sql<SourceRow[]>`
      SELECT
        id,
        name,
        base_url,
        enabled,
        crawl_depth,
        include_patterns,
        exclude_patterns,
        tags,
        notes,
        last_indexed_at
      FROM sources
      ORDER BY id DESC;
    `;
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: "getSourcesDb failed: " + toErrorMessage(err) };
  }
}

/**
 * Create a source.
 */
export async function createSourceDb(input: {
  name: string;
  base_url: string;
  enabled?: boolean;
  crawl_depth?: number;
  include_patterns?: string | null;
  exclude_patterns?: string | null;
  tags?: string | null;
  notes?: string | null;
}): Promise<ActionResult<SourceRow>> {
  try {
    const enabled = input.enabled ?? true;
    const crawlDepth = input.crawl_depth ?? 1;

    const rows = await sql<SourceRow[]>`
      INSERT INTO sources (
        name, base_url, enabled, crawl_depth, include_patterns, exclude_patterns, tags, notes
      )
      VALUES (
        ${input.name},
        ${input.base_url},
        ${enabled},
        ${crawlDepth},
        ${input.include_patterns ?? null},
        ${input.exclude_patterns ?? null},
        ${input.tags ?? null},
        ${input.notes ?? null}
      )
      RETURNING
        id,
        name,
        base_url,
        enabled,
        crawl_depth,
        include_patterns,
        exclude_patterns,
        tags,
        notes,
        last_indexed_at;
    `;

    revalidatePath("/sources");
    return { ok: true, data: rows[0] };
  } catch (err) {
    return { ok: false, error: "createSourceDb failed: " + toErrorMessage(err) };
  }
}

/**
 * Update a source.
 */
export async function updateSourceDb(
  id: number,
  patch: Partial<{
    name: string;
    base_url: string;
    enabled: boolean;
    crawl_depth: number;
    include_patterns: string | null;
    exclude_patterns: string | null;
    tags: string | null;
    notes: string | null;
    last_indexed_at: string | null;
  }>
): Promise<ActionResult<SourceRow>> {
  try {
    const rows = await sql<SourceRow[]>`
      UPDATE sources
      SET
        name = COALESCE(${patch.name ?? null}, name),
        base_url = COALESCE(${patch.base_url ?? null}, base_url),
        enabled = COALESCE(${patch.enabled ?? null}, enabled),
        crawl_depth = COALESCE(${patch.crawl_depth ?? null}, crawl_depth),
        include_patterns = COALESCE(${patch.include_patterns ?? null}, include_patterns),
        exclude_patterns = COALESCE(${patch.exclude_patterns ?? null}, exclude_patterns),
        tags = COALESCE(${patch.tags ?? null}, tags),
        notes = COALESCE(${patch.notes ?? null}, notes),
        last_indexed_at = COALESCE(${patch.last_indexed_at ?? null}, last_indexed_at)
      WHERE id = ${id}
      RETURNING
        id,
        name,
        base_url,
        enabled,
        crawl_depth,
        include_patterns,
        exclude_patterns,
        tags,
        notes,
        last_indexed_at;
    `;

    if (!rows[0]) {
      return { ok: false, error: `updateSourceDb failed: source ${id} not found` };
    }

    revalidatePath("/sources");
    return { ok: true, data: rows[0] };
  } catch (err) {
    return { ok: false, error: "updateSourceDb failed: " + toErrorMessage(err) };
  }
}

/**
 * Delete a source.
 */
export async function deleteSourceDb(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    const rows = await sql<{ id: number }[]>`
      DELETE FROM sources
      WHERE id = ${id}
      RETURNING id;
    `;

    if (!rows[0]) {
      return { ok: false, error: `deleteSourceDb failed: source ${id} not found` };
    }

    revalidatePath("/sources");
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: "deleteSourceDb failed: " + toErrorMessage(err) };
  }
}

/**
 * Convenience: toggle enabled.
 */
export async function setSourceEnabledDb(
  id: number,
  enabled: boolean
): Promise<ActionResult<SourceRow>> {
  return updateSourceDb(id, { enabled });
}
