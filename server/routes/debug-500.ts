import { gzipSync, gunzipSync } from 'node:zlib';

export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};
  const db = event.context?.cloudflare?.env?.DB;

  // Test 1: env + Buffer availability
  results.env = {
    hasAssets: !!event.context?.cloudflare?.env?.ASSETS,
    hasDB: !!db,
    bufferExists: typeof Buffer !== 'undefined',
    bufferFromWorks: false,
    decompressWorks: false,
  };

  // Test 2: Buffer.from + gzip roundtrip
  try {
    const testData = JSON.stringify(['test']);
    const compressed = gzipSync(Buffer.from(testData)).toString('base64');
    const buf = Buffer.from(compressed, 'base64');
    const decompressed = gunzipSync(buf).toString('utf-8');
    const parsed = JSON.parse(decompressed);
    (results.env as Record<string, unknown>).bufferFromWorks = true;
    (results.env as Record<string, unknown>).decompressWorks = parsed[0] === 'test';
  } catch (e: unknown) {
    (results.env as Record<string, unknown>).bufferError = (e as Error).message;
  }

  // Test 3: direct D1 query (bypass content module)
  if (db) {
    try {
      // Check if tables exist
      const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      results.d1Tables = { ok: true, tables: tables.results?.map((r: Record<string, string>) => r.name) };
    } catch (e: unknown) {
      results.d1Tables = { ok: false, error: (e as Error).message };
    }

    try {
      // Try to read from _content_info
      const info = await db.prepare('SELECT * FROM _content_info').all();
      results.d1Info = { ok: true, rows: info.results };
    } catch (e: unknown) {
      results.d1Info = { ok: false, error: (e as Error).message };
    }

    try {
      // Try to count docs
      const count = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').first();
      results.d1DocsCount = { ok: true, count };
    } catch (e: unknown) {
      results.d1DocsCount = { ok: false, error: (e as Error).message };
    }
  }

  // Test 4: web DecompressionStream (used by @nuxt/content)
  try {
    const testData = JSON.stringify(['test-stream']);
    const compressed = gzipSync(Buffer.from(testData));
    const uint8 = new Uint8Array(compressed);
    const blob = new Blob([uint8]);
    const stream = blob.stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(decompressedStream).text();
    const parsed = JSON.parse(text);
    results.webDecompress = { ok: true, result: parsed };
  } catch (e: unknown) {
    results.webDecompress = { ok: false, error: (e as Error).message, stack: (e as Error).stack?.split('\n').slice(0, 5) };
  }

  // Test 5: fetch info dump + decompress (mimics @nuxt/content init)
  try {
    const raw = await $fetch<string>('/__nuxt_content/info/sql_dump.txt', {
      headers: { 'content-type': 'text/plain' },
    });
    const buf = Buffer.from(raw, 'base64');
    const uint8 = Uint8Array.from(buf);
    const resp = new Response(new Blob([uint8]));
    const decompStream = resp.body?.pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(decompStream).text();
    const parsed = JSON.parse(text);
    results.infoDumpDecompress = { ok: true, parsed };
  } catch (e: unknown) {
    results.infoDumpDecompress = { ok: false, error: (e as Error).message };
  }

  // Test 6: actual content query via $fetch
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { sql: 'SELECT COUNT(*) as cnt FROM _content_docs' },
    });
    results.contentQuery = { ok: true, result: content };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown };
    results.contentQuery = { ok: false, error: err.message, data: err.data };
  }

  return results;
});
