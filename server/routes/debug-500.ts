export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: Content query works (proven)
  try {
    const content = await $fetch('/__nuxt_content/docs/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        sql: `SELECT * FROM _content_docs WHERE ("path" = '/docs/components/animated-list') ORDER BY "stem" ASC LIMIT 1`,
      },
    });
    results.contentQuery = {
      ok: true,
      length: Array.isArray(content) ? content.length : 0,
      title: Array.isArray(content) && content.length > 0 ? (content[0] as Record<string, unknown>)?.title : null,
    };
  } catch (e: unknown) {
    results.contentQuery = { ok: false, error: (e as Error).message };
  }

  // Test 2: SSR render of doc page (crashes with .buffer error)
  try {
    const html = await $fetch<string>('/docs/components/animated-list', {
      headers: { accept: 'text/html' },
    });
    results.ssrDocPage = { ok: true, length: html.length };
  } catch (e: unknown) {
    const err = e as Error & { statusCode?: number; stack?: string; cause?: Error };
    results.ssrDocPage = {
      ok: false,
      error: err.message,
      statusCode: err.statusCode,
      causeMsg: err.cause?.message,
      causeStack: err.cause?.stack?.split('\n').slice(0, 5),
      stack: err.stack?.split('\n').slice(0, 8),
    };
  }

  // Test 3: SSR render of homepage (works)
  try {
    const html = await $fetch<string>('/', {
      headers: { accept: 'text/html' },
    });
    results.ssrHomepage = { ok: true, length: html.length };
  } catch (e: unknown) {
    results.ssrHomepage = { ok: false, error: (e as Error).message };
  }

  // Test 4: SSR render of docs INDEX (no content query, should work)
  try {
    const html = await $fetch<string>('/docs/', {
      headers: { accept: 'text/html' },
    });
    results.ssrDocsIndex = { ok: true, length: html.length };
  } catch (e: unknown) {
    results.ssrDocsIndex = { ok: false, error: (e as Error).message };
  }

  // Test 5: Try rendering a page that uses MDC/content rendering
  // Use the ContentRenderer directly
  try {
    const html = await $fetch<string>('/docs/text-animations/blur-text', {
      headers: { accept: 'text/html' },
    });
    results.ssrTextPage = { ok: true, length: html.length };
  } catch (e: unknown) {
    const err = e as Error & { statusCode?: number; message: string };
    results.ssrTextPage = { ok: false, error: err.message, statusCode: err.statusCode };
  }

  return results;
});
