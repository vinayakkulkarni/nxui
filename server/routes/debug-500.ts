export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: Direct D1 query (bypass content module entirely)
  try {
    const db = event.context?.cloudflare?.env?.DB;
    if (db) {
      const stmt = db.prepare('SELECT COUNT(*) as cnt FROM _content_docs');
      const d1Result = await stmt.first();
      results.d1Direct = { ok: true, count: d1Result?.cnt };
    } else {
      results.d1Direct = { ok: false, error: 'DB binding not available' };
    }
  } catch (e: unknown) {
    results.d1Direct = { ok: false, error: (e as Error).message };
  }

  // Test 2: Direct D1 query for a specific doc
  try {
    const db = event.context?.cloudflare?.env?.DB;
    if (db) {
      const stmt = db.prepare(
        `SELECT "id", "path", "title" FROM _content_docs WHERE "path" = ? LIMIT 1`,
      );
      const row = await stmt.bind('/docs/components/animated-list').first();
      results.d1DocQuery = { ok: true, found: !!row, row };
    } else {
      results.d1DocQuery = { ok: false, error: 'DB binding not available' };
    }
  } catch (e: unknown) {
    results.d1DocQuery = { ok: false, error: (e as Error).message };
  }

  // Test 3: Internal $fetch to content query endpoint (this is what fails)
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { sql: 'SELECT COUNT(*) as cnt FROM _content_docs' },
    });
    results.internalFetch = { ok: true, result: content };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown; cause?: Error; statusCode?: number };
    results.internalFetch = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      causeMessage: err.cause?.message,
      causeStack: err.cause?.stack?.split('\n').slice(0, 5),
      stack: err.stack?.split('\n').slice(0, 8),
    };
  }

  // Test 4: event.$fetch vs $fetch (content module uses event.$fetch when event exists)
  try {
    const content = await event.$fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { sql: 'SELECT COUNT(*) as cnt FROM _content_docs' },
    });
    results.eventFetch = { ok: true, result: content };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown; cause?: Error; statusCode?: number };
    results.eventFetch = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      causeMessage: err.cause?.message,
      causeStack: err.cause?.stack?.split('\n').slice(0, 5),
      stack: err.stack?.split('\n').slice(0, 8),
    };
  }

  // Test 5: Check what request headers are being forwarded
  try {
    const { getRequestHeaders } = await import('h3');
    const headers = getRequestHeaders(event);
    results.requestHeaders = {
      'accept-encoding': headers['accept-encoding'],
      'content-type': headers['content-type'],
      accept: headers['accept'],
      'cf-ray': headers['cf-ray'],
      host: headers['host'],
    };
  } catch (e: unknown) {
    results.requestHeaders = { error: (e as Error).message };
  }

  // Test 6: Try sql_dump.txt fetch (D1 init path)
  try {
    const dump = await $fetch('/__nuxt_content/docs/sql_dump.txt', {
      responseType: 'text',
    });
    results.sqlDump = {
      ok: true,
      length: typeof dump === 'string' ? dump.length : 0,
      preview: typeof dump === 'string' ? dump.substring(0, 100) : 'not-string',
    };
  } catch (e: unknown) {
    const err = e as Error & { statusCode?: number };
    results.sqlDump = { ok: false, error: err.message, statusCode: err.statusCode };
  }

  // Test 7: Check available env bindings
  try {
    const env = event.context?.cloudflare?.env;
    results.envBindings = {
      hasDB: !!env?.DB,
      hasASSETS: !!env?.ASSETS,
      dbType: env?.DB ? typeof env.DB : 'undefined',
      envKeys: env ? Object.keys(env) : [],
    };
  } catch (e: unknown) {
    results.envBindings = { error: (e as Error).message };
  }

  // Test 8: External curl equivalent - POST to content query using event.fetch (h3)
  try {
    const { getRequestURL } = await import('h3');
    const baseURL = getRequestURL(event);
    const origin = baseURL.origin;
    const res = await fetch(`${origin}/__nuxt_content/docs/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sql: 'SELECT COUNT(*) as cnt FROM _content_docs' }),
    });
    const body = await res.text();
    results.externalFetch = {
      ok: res.ok,
      status: res.status,
      body: body.substring(0, 200),
    };
  } catch (e: unknown) {
    results.externalFetch = { ok: false, error: (e as Error).message };
  }

  return results;
});
