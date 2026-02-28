export default defineEventHandler(async (event) => {
  const results: Record<string, unknown> = {};

  // Test 1: Direct D1 via event.context (works)
  try {
    const db = event.context?.cloudflare?.env?.DB;
    if (db) {
      const d1Result = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').first();
      results.d1Direct = { ok: true, count: d1Result?.cnt };
    } else {
      results.d1Direct = { ok: false, error: 'DB binding not available' };
    }
  } catch (e: unknown) {
    results.d1Direct = { ok: false, error: (e as Error).message };
  }

  // Test 2: Check globalThis.__env__ (what db0 connector uses)
  try {
    const globalEnv = (globalThis as Record<string, unknown>).__env__ as
      | Record<string, unknown>
      | undefined;
    const cfEnv = (globalThis as Record<string, unknown>).__cf_env__ as
      | Record<string, unknown>
      | undefined;
    results.globalBindings = {
      hasGlobalEnv: !!globalEnv,
      globalEnvKeys: globalEnv ? Object.keys(globalEnv) : [],
      hasGlobalEnvDB: !!globalEnv?.DB,
      hasCfEnv: !!cfEnv,
      cfEnvKeys: cfEnv ? Object.keys(cfEnv) : [],
      hasCfEnvDB: !!cfEnv?.DB,
    };
  } catch (e: unknown) {
    results.globalBindings = { error: (e as Error).message };
  }

  // Test 3: Try db0 D1 connector directly
  try {
    const globalEnv = (globalThis as Record<string, unknown>).__env__ as
      | Record<string, unknown>
      | undefined;
    const cfEnv = (globalThis as Record<string, unknown>).__cf_env__ as
      | Record<string, unknown>
      | undefined;
    const binding = globalEnv?.DB || cfEnv?.DB;
    if (binding) {
      const db = binding as { prepare: (sql: string) => { first: () => Promise<unknown> } };
      const row = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').first();
      results.db0Adapter = { ok: true, result: row };
    } else {
      results.db0Adapter = { ok: false, error: 'DB not found in globalThis.__env__ or __cf_env__' };
    }
  } catch (e: unknown) {
    results.db0Adapter = { ok: false, error: (e as Error).message };
  }

  // Test 4: Check runtime config content settings
  try {
    const config = useRuntimeConfig();
    results.contentConfig = {
      database: config.content?.database,
      integrityCheck: config.content?.integrityCheck,
      databaseVersion: config.content?.databaseVersion,
    };
  } catch (e: unknown) {
    results.contentConfig = { error: (e as Error).message };
  }

  // Test 5: Internal $fetch to content query (the failing path)
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
      stack: err.stack?.split('\n').slice(0, 8),
    };
  }

  // Test 6: Try manually calling the content query handler logic
  try {
    const config = useRuntimeConfig();
    const globalEnv = (globalThis as Record<string, unknown>).__env__ as
      | Record<string, unknown>
      | undefined;
    const cfEnv = (globalThis as Record<string, unknown>).__cf_env__ as
      | Record<string, unknown>
      | undefined;
    const binding = globalEnv?.DB || cfEnv?.DB;

    if (binding) {
      const db = binding as {
        prepare: (sql: string) => {
          all: () => Promise<{ results: unknown[] }>;
        };
      };
      const res = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').all();
      results.manualQuery = { ok: true, results: res.results };
    } else {
      // Try event.context path as fallback
      const db = event.context?.cloudflare?.env?.DB;
      if (db) {
        const res = await db.prepare('SELECT COUNT(*) as cnt FROM _content_docs').all();
        results.manualQuery = {
          ok: true,
          results: res.results,
          note: 'Used event.context.cloudflare.env.DB (globalThis.__env__ was empty)',
        };
      } else {
        results.manualQuery = { ok: false, error: 'No D1 binding found anywhere' };
      }
    }
  } catch (e: unknown) {
    results.manualQuery = { ok: false, error: (e as Error).message };
  }

  // Test 7: Check if _content_info table exists (integrity check table)
  try {
    const db = event.context?.cloudflare?.env?.DB;
    if (db) {
      const info = await db
        .prepare("SELECT * FROM _content_info WHERE id = 'checksum_docs'")
        .first();
      results.integrityTable = { ok: true, info };
    }
  } catch (e: unknown) {
    results.integrityTable = { ok: false, error: (e as Error).message };
  }

  return results;
});
