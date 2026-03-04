---
title: Configure WASM Module Imports for Cloudflare Workers
impact: MEDIUM
impactDescription: Enables WASM-dependent packages like @cf-wasm/og to work on CF Workers
tags: cloudflare, wasm, nitro, cf-wasm, workers
---

## Configure WASM Module Imports for Cloudflare Workers

WASM modules on Cloudflare Workers require specific Nitro configuration. Without it, `WebAssembly.instantiate()` calls fail because CF Workers restrict dynamic WASM compilation for security reasons. The `@cf-wasm/og` package (used for OG image generation) needs ESM WASM imports with lazy loading.

**Incorrect (no WASM config):**

```typescript
// ❌ WRONG — WASM modules fail with "WebAssembly.instantiate() is not allowed"
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    // Missing wasm config
  },
});
```

**Correct (WASM ESM imports with lazy loading):**

```typescript
// ✅ CORRECT — Enable WASM for CF Workers
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    wasm: {
      // Allow import wasm from './module.wasm' syntax
      esmImport: true,
      // Lazy-load WASM modules (required for CF Workers)
      lazy: true,
    },
  },
});
```

**Why lazy loading matters:**

Cloudflare Workers don't allow `WebAssembly.instantiate()` at the top level during cold start. With `lazy: true`, WASM modules are loaded on first use, which is allowed by the Workers runtime. Without it, the module tries to instantiate at import time and fails.

**Packages that require this config:**

- `@cf-wasm/og` — OG image generation (Satori + Resvg WASM)
- `@cf-wasm/photon` — Image manipulation
- Any package that ships `.wasm` files

**Combined with dynamic import:**

```typescript
// The WASM config enables this pattern in server routes:
const { ImageResponse } = await import('@cf-wasm/og/workerd');
// The 'workerd' subpath uses CF Workers-compatible WASM loading
```

**Testing note:** WASM-dependent routes won't work in local `nuxt dev` (Node.js runtime). Test on Cloudflare Workers preview (`wrangler pages dev`) or production deployment.

Reference: [Nitro WASM Support](https://nitro.unjs.io/guide/wasm) | [Cloudflare Workers WASM](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
