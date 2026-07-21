---
title: Configure Nitro for Cloudflare Pages Deployment
impact: HIGH
impactDescription: Ensures WASM support, Node.js compatibility, and proper builds on CF Pages
tags: cloudflare, nitro, nuxt-config, wasm, node-compat, deployment
---

## Configure Nitro for Cloudflare Pages Deployment

Cloudflare Pages/Workers have specific requirements for WASM modules, Node.js APIs, and global objects. Without proper Nitro configuration, builds fail or runtime errors occur.

**Incorrect (minimal config):**

```typescript
// ❌ WRONG — Missing critical CF Workers config
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare_pages',
  },
});
```

**Correct (full CF Pages config):**

```typescript
// ✅ CORRECT — Full Cloudflare configuration (single nitro block)
export default defineNuxtConfig({
  compatibilityDate: '2025-07-18',

  nitro: {
    // 'cloudflare_module' is the recommended preset for Workers deployments.
    // Use 'cloudflare_pages' (underscore) if you deploy via Cloudflare Pages.
    preset: 'cloudflare_module',

    // WASM module support for @cf-wasm/og and similar packages
    wasm: {
      esmImport: true,
      lazy: true,
    },
  },

  vite: {
    ssr: {
      // Externalize client-only libraries from server bundle
      external: ['posthog-js'],
    },
  },
});
```

**Enabling Node.js compatibility (Buffer, crypto, `process`, etc.):**

There is no `cloudflare: { nodeCompat: true }` Nuxt key. Node.js compatibility comes from the `nodejs_compat` **compatibility flag** in your Wrangler config, which requires `compatibility_date >= 2024-09-23`:

```jsonc
// wrangler.jsonc
{
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
}
```

You can also let Nitro generate/merge this via the `nitro.cloudflare.wrangler` passthrough:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      wrangler: {
        compatibility_date: '2024-09-23',
        compatibility_flags: ['nodejs_compat'],
      },
    },
  },
});
```

**`process.stdout` workaround (only without `nodejs_compat`):**

If you have NOT enabled `nodejs_compat`, some libraries reference `process.stdout`, which doesn't exist on Workers. Stub it via Vite `define`:

```typescript
vite: {
  define: {
    // Only needed when nodejs_compat is NOT enabled.
    // With the flag (compatibility_date >= 2024-09-23), `process` is natively supported.
    'process.stdout': 'undefined',
  },
},
```

**Configuration breakdown:**

| Setting                                  | Why                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `compatibilityDate: '2025-07-18'`        | Pinned date — never use `'latest'`                                          |
| `nitro.preset: 'cloudflare_module'`      | Recommended preset for Workers (`cloudflare_pages` for Pages)               |
| `compatibility_flags: ['nodejs_compat']` | Enables `Buffer`, `crypto`, `process`, and other Node.js APIs on Workers    |
| `process.stdout: 'undefined'`            | Only without `nodejs_compat` — stubs the missing `process.stdout` reference |
| `vite.ssr.external`                      | Keeps client-only libraries out of the server bundle                        |
| `wasm.esmImport: true`                   | Allows `import wasm from './file.wasm'` syntax                              |
| `wasm.lazy: true`                        | Lazy-loads WASM modules (required for CF Workers dynamic instantiation)     |

**Common errors these settings fix:**

```
# Without nodejs_compat flag:
ReferenceError: Buffer is not defined

# Without process.stdout stub (and no nodejs_compat):
TypeError: Cannot read properties of undefined (reading 'write')

# Without wasm config:
CompileError: WebAssembly.instantiate() is not allowed

# Without ssr.external for posthog-js:
Error: symbol 'a' already declared (esbuild on Linux CI)
```

**Note:** Declare `nitro` only ONCE — a duplicate `nitro:` key silently overrides the first (dropping your `preset`). Keep `preset`, `wasm`, and `cloudflare` inside the single `nitro` block.

Reference: [Nuxt Cloudflare Deployment](https://nuxt.com/deploy/cloudflare) | [Nitro Cloudflare Provider](https://nitro.build/deploy/providers/cloudflare)
