export default defineEventHandler(async (event) => {
  try {
    // Simulate what the docs page does - fetch content via queryCollection
    const result = await $fetch('/__nuxt_content/docs/sql_dump.txt', {
      headers: { 'content-type': 'text/plain' },
    });
    return {
      success: true,
      dumpLength: typeof result === 'string' ? result.length : 'not-string',
      dumpStart: typeof result === 'string' ? result.substring(0, 50) : String(result).substring(0, 50),
      env: {
        hasAssets: !!event.context?.cloudflare?.env?.ASSETS,
        hasDB: !!event.context?.cloudflare?.env?.DB,
      },
    };
  } catch (error: unknown) {
    const err = error as Error & { stack?: string };
    return {
      error: true,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 15),
      name: err.name,
    };
  }
});
