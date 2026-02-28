import { gzipSync } from 'node:zlib';

/**
 * Workaround for @nuxt/content v3.12.0 bug:
 * The Cloudflare preset registers a sql_dump.txt route for ALL collections
 * (including the private "info" collection), but never generates a dump.info.sql
 * file at build time. When the default handler fetches from ASSETS, it gets the
 * SPA fallback HTML, which crashes decompressSQLDump().
 *
 * This override returns an empty compressed dump for the "info" collection.
 *
 * @see https://github.com/nuxt/content/issues/3729
 */
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain');
  return gzipSync(Buffer.from(JSON.stringify([]))).toString('base64');
});
