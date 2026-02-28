export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: env bindings
  results.env = {
    hasAssets: !!event.context?.cloudflare?.env?.ASSETS,
    hasDB: !!event.context?.cloudflare?.env?.DB,
  };

  // Test 2: fetch docs dump
  try {
    const dump = await $fetch('/__nuxt_content/docs/sql_dump.txt', {
      headers: { 'content-type': 'text/plain' },
    });
    results.docsDump = { ok: true, length: typeof dump === 'string' ? dump.length : 'not-string' };
  } catch (e: unknown) {
    results.docsDump = { ok: false, error: (e as Error).message };
  }

  // Test 3: fetch info dump
  try {
    const dump = await $fetch('/__nuxt_content/info/sql_dump.txt', {
      headers: { 'content-type': 'text/plain' },
    });
    results.infoDump = { ok: true, length: typeof dump === 'string' ? dump.length : 'not-string' };
  } catch (e: unknown) {
    results.infoDump = { ok: false, error: (e as Error).message };
  }

  // Test 4: query content via D1
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { sql: 'SELECT COUNT(*) as cnt FROM _content_docs' },
    });
    results.d1Query = { ok: true, result: content };
  } catch (e: unknown) {
    const err = e as Error & { stack?: string; data?: unknown };
    results.d1Query = {
      ok: false,
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 10),
      data: err.data,
    };
  }

  // Test 5: internal SSR render of a doc page
  try {
    const html = await $fetch('/docs/text-animations/gradient-text', {
      headers: { accept: 'text/html' },
    });
    results.ssrRender = { ok: true, length: typeof html === 'string' ? html.length : 'not-string' };
  } catch (e: unknown) {
    const err = e as Error & { stack?: string; data?: unknown; statusCode?: number };
    results.ssrRender = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      stack: err.stack?.split('\n').slice(0, 15),
      data: err.data,
    };
  }

  return results;
});
