export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: Content query via internal $fetch (mimics what SSR does)
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

  // Test 2: Content query with WHERE (this is what queryCollection().path().first() generates)
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        sql: `SELECT * FROM _content_docs WHERE "path" = '/docs/components/animated-list' ORDER BY "stem" ASC LIMIT 1`,
      },
    });
    results.contentQueryWhere = { ok: true, count: Array.isArray(content) ? content.length : 'not-array' };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown; stack?: string };
    results.contentQueryWhere = {
      ok: false,
      error: err.message,
      data: err.data,
      stack: err.stack?.split('\n').slice(0, 5),
    };
  }

  // Test 3: Fetch OG image font (tests if font resolution works)
  try {
    const fontRes = await $fetch<ArrayBuffer>('/_og-satori-fonts/Inter-400-normal.woff', {
      responseType: 'arrayBuffer',
    });
    results.fontFetch = { ok: true, size: fontRes.byteLength };
  } catch (e: unknown) {
    const err = e as Error;
    results.fontFetch = { ok: false, error: err.message };
  }

  // Test 4: Try ASSETS font fetch (Cloudflare way)
  try {
    const assets = event.context?.cloudflare?.env?.ASSETS || (event as Record<string, unknown>).context?.ASSETS;
    if (assets && typeof (assets as { fetch: unknown }).fetch === 'function') {
      const assetFetch = assets as { fetch: (url: string) => Promise<Response> };
      const res = await assetFetch.fetch('/_og-satori-fonts/Inter-400-normal.woff').catch(() => null);
      results.assetsFontFetch = {
        ok: res?.ok ?? false,
        status: res?.status,
        hasBody: !!res?.body,
      };
    } else {
      results.assetsFontFetch = { ok: false, error: 'ASSETS not available' };
    }
  } catch (e: unknown) {
    results.assetsFontFetch = { ok: false, error: (e as Error).message };
  }

  // Test 5: Try SSR render of a page via internal fetch
  try {
    const html = await $fetch<string>('/docs/components/animated-list', {
      headers: { accept: 'text/html' },
    });
    results.ssrRender = { ok: true, length: html.length, hasError: html.includes('500') && html.includes('Server Error') };
  } catch (e: unknown) {
    const err = e as Error & { data?: unknown; statusCode?: number; stack?: string };
    results.ssrRender = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      stack: err.stack?.split('\n').slice(0, 8),
    };
  }

  // Test 6: List OG font files available in ASSETS
  try {
    const assets = event.context?.cloudflare?.env?.ASSETS;
    if (assets && typeof (assets as { fetch: unknown }).fetch === 'function') {
      const assetFetch = assets as { fetch: (url: string) => Promise<Response> };
      // Try to list known font paths
      const fontPaths = [
        '/_og-satori-fonts/Inter-400-normal.woff',
        '/_og-satori-fonts/Satoshi-400-normal.woff',
        '/_og-satori-fonts/Satoshi-400.woff',
      ];
      const fontResults: Record<string, { status: number; ok: boolean }> = {};
      for (const p of fontPaths) {
        try {
          const res = await assetFetch.fetch(p);
          fontResults[p] = { status: res.status, ok: res.ok };
        } catch {
          fontResults[p] = { status: 0, ok: false };
        }
      }
      results.fontPaths = fontResults;
    }
  } catch (e: unknown) {
    results.fontPaths = { error: (e as Error).message };
  }

  return results;
});
