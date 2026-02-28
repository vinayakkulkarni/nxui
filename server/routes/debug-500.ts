export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: Direct D1 query
  try {
    const db = event.context?.cloudflare?.env?.DB;
    if (db) {
      const d1Result = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').first();
      results.d1Direct = { ok: true, count: d1Result?.cnt };
    }
  } catch (e: unknown) {
    results.d1Direct = { ok: false, error: (e as Error).message };
  }

  // Test 2: Content query with VALID SQL (assertSafeQuery requires ORDER BY)
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        sql: `SELECT * FROM _content_docs WHERE ("path" = '/docs/components/animated-list') ORDER BY "stem" ASC LIMIT 1`,
      },
    });
    results.contentQueryValid = {
      ok: true,
      isArray: Array.isArray(content),
      length: Array.isArray(content) ? content.length : 0,
      firstTitle: Array.isArray(content) && content.length > 0 ? (content[0] as Record<string, unknown>)?.title : null,
    };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown; statusCode?: number };
    results.contentQueryValid = { ok: false, error: err.message, statusCode: err.statusCode };
  }

  // Test 3: SSR render of a doc page (the user-facing failure)
  try {
    const html = await $fetch<string>('/docs/components/animated-list', {
      headers: { accept: 'text/html' },
    });
    results.ssrRender = {
      ok: true,
      length: html.length,
      hasContent: html.includes('Animated List'),
    };
  } catch (e: unknown) {
    const err = e as Error & { statusCode?: number; stack?: string };
    results.ssrRender = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      stack: err.stack?.split('\n').slice(0, 10),
    };
  }

  // Test 4: globalThis.__env__ and content config
  try {
    const globalEnv = (globalThis as Record<string, unknown>).__env__ as Record<string, unknown> | undefined;
    const config = useRuntimeConfig();
    results.config = {
      hasGlobalEnvDB: !!globalEnv?.DB,
      integrityCheck: config.content?.integrityCheck,
      database: config.content?.database,
    };
  } catch (e: unknown) {
    results.config = { error: (e as Error).message };
  }

  return results;
});
