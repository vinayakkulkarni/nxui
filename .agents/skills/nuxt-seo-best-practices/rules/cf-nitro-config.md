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
    preset: 'cloudflare-pages',
  },
});
```

**Correct (full CF Pages config):**

```typescript
// ✅ CORRECT — Full Cloudflare Pages configuration
export default defineNuxtConfig({
  compatibilityDate: '2025-07-18',

  nitro: {
    preset: 'cloudflare-pages',
  },

  cloudflare: {
    // Enable Node.js API compatibility (Buffer, crypto, etc.)
    nodeCompat: true,
  },

  vite: {
    // Replace process.stdout (not available in CF Workers)
    define: {
      'process.stdout': 'undefined',
    },
    ssr: {
      // Externalize client-only libraries from server bundle
      external: ['posthog-js'],
    },
  },

  // WASM module support for @cf-wasm/og and similar packages
  nitro: {
    wasm: {
      esmImport: true,
      lazy: true,
    },
  },
});
```

**Configuration breakdown:**

| Setting                           | Why                                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| `compatibilityDate: '2025-07-18'` | Pinned date — never use `'latest'`                                      |
| `cloudflare.nodeCompat: true`     | Enables `Buffer`, `crypto`, and other Node.js APIs on Workers           |
| `process.stdout: 'undefined'`     | `process.stdout` doesn't exist on Workers — some libraries reference it |
| `vite.ssr.external`               | Keeps client-only libraries out of the server bundle                    |
| `wasm.esmImport: true`            | Allows `import wasm from './file.wasm'` syntax                          |
| `wasm.lazy: true`                 | Lazy-loads WASM modules (required for CF Workers dynamic instantiation) |

**Common errors these settings fix:**

```
# Without nodeCompat:
ReferenceError: Buffer is not defined

# Without process.stdout replace:
TypeError: Cannot read properties of undefined (reading 'write')

# Without wasm config:
CompileError: WebAssembly.instantiate() is not allowed

# Without ssr.external for posthog-js:
Error: symbol 'a' already declared (esbuild on Linux CI)
```

**Note:** The `process.stdout` replacement and `wasm` config may need to be in the top-level `vite` and `nitro` keys respectively — check your Nuxt version for the correct placement.

Reference: [Nuxt Cloudflare Deployment](https://nuxt.com/deploy/cloudflare) | [Nitro Cloudflare Preset](https://nitro.unjs.io/deploy/providers/cloudflare)
