"use server";

import { sql } from "@/lib/db";

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
