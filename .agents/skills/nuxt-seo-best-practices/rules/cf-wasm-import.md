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
    preset: 'cloudflare_module',
    // Missing wasm config
  },
});
```

**Correct (WASM ESM imports with lazy loading):**

```typescript
// ✅ CORRECT — Enable WASM for CF Workers
export default defineNuxtConfig({
  nitro: {
    // 'cloudflare_module' is recommended for Workers; 'cloudflare_pages' for Pages
    preset: 'cloudflare_module',
    wasm: {
      // Allow import wasm from './module.wasm' syntax
      esmImport: true,
      // Lazy-load WASM modules (required for CF Workers)
      lazy: true,
    },
  },
});
```

**Why this config matters:**

Cloudflare Workers disallow compiling WASM from arbitrary bytes at runtime (`WebAssembly.instantiate()` / `WebAssembly.compile()` on raw buffers). Setting `esmImport: true` makes each `.wasm` a first-class ES module that is compiled at deploy time (not from runtime bytes), and `lazy: true` defers instantiation until first use rather than at import. Together they satisfy the Workers restriction while keeping cold starts fast.

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

Reference: [Nitro WASM Config](https://nitro.build/config#wasm) | [Cloudflare Workers WASM](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
