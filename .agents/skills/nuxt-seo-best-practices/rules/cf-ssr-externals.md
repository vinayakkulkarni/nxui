---
title: Externalize Client-Only Libraries from SSR Bundle
impact: HIGH
impactDescription: Prevents server bundle contamination and esbuild errors on CI
tags: cloudflare, ssr, vite, external, posthog, client-only
---

## Externalize Client-Only Libraries from SSR Bundle

Client-only libraries (analytics, tracking, browser APIs) should never be bundled into the Nitro server entry. When they leak into the server bundle, they cause esbuild errors on CI (especially Linux) due to duplicate symbol declarations from minified code.

**Incorrect (client-only library leaks into server bundle):**

```typescript
// ❌ WRONG — @posthog/nuxt registers its vue-plugin for both client AND server
// This leaks ~4500 lines of minified posthog-js into the Nitro server bundle
// On Linux CI, esbuild@0.27+ errors with "symbol 'a' already declared"

export default defineNuxtConfig({
  modules: ['@posthog/nuxt'],
  // No vite.ssr.external — posthog-js is bundled into server entry
});
```

**Correct (externalize with vite.ssr.external):**

```typescript
// ✅ CORRECT — Externalize client-only libraries from server bundle
export default defineNuxtConfig({
  modules: ['@posthog/nuxt'],

  vite: {
    ssr: {
      // Keep posthog-js out of the Nitro server bundle
      // The module bug registers the vue-plugin without { mode: 'client' }
      external: ['posthog-js'],
    },
  },
});
```

**How to identify leaking libraries:**

1. **Build error on CI but not locally:** Different esbuild binaries (macOS vs Linux) have different strictness levels for duplicate declarations
2. **Check server entry size:** `wc -l .output/server/chunks/nitro/...` — if it's thousands of lines larger than expected, something leaked
3. **Search the server bundle:** `grep 'posthog' .output/server/` — if a client-only library appears, it leaked

**Common client-only libraries to externalize:**

```typescript
vite: {
  ssr: {
    external: [
      'posthog-js',       // PostHog analytics
      'hotjar',           // Hotjar tracking
      'intercom-client',  // Intercom chat widget
      // Add any library that uses window, document, or browser APIs
    ],
  },
},
```

**Root cause:** Some Nuxt modules register their Vue plugins for both client and server instead of using `{ mode: 'client' }`. This is a module bug, but the `vite.ssr.external` workaround is safe and reliable.

**Real error example:**

```
✘ [ERROR] The symbol "a" has already been declared
   .output/server/chunks/nitro/nitro.mjs:12345:6
```

This error appears on Linux CI (esbuild is stricter there) when minified client-only code with single-letter variables is merged into the Rollup server output.
