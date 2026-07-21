---
title: Pin compatibilityDate, Never Use 'latest'
impact: HIGH
impactDescription: Prevents unpredictable Nitro behavior changes between builds
tags: cloudflare, nitro, nuxt-config, compatibility, deployment
---

## Pin compatibilityDate, Never Use 'latest'

Nuxt's `compatibilityDate` pins the date Nitro uses to decide which deployment-preset features and default behaviors to enable, and it is forwarded to the `compatibility_date` in the generated Wrangler config. It is distinct from — but feeds — Cloudflare's Workers-runtime compatibility date. Leaving it unset (or on `'latest'`) means Nitro applies its newest default behavior, which can shift when you upgrade Nitro. Pin a date for reproducible builds.

**Incorrect (unset / using 'latest'):**

```typescript
// ❌ WRONG — Nitro applies its newest defaults, which can shift on upgrade
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  // Behavior can change the next time you bump Nitro — not reproducible
});
```

**Correct (pinned date):**

```typescript
// ✅ CORRECT — Pinned to a specific date
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-18',
  // Consistent behavior across all builds
  // Update intentionally when you want new Nitro features
});
```

**When to update:**

- When upgrading Nuxt or Nitro versions
- When you need a specific Nitro feature that requires a newer date
- Always test after updating — some changes are breaking

**How to find the right date:**

- Use today's date (or your last-tested date)
- If you rely on `nodejs_compat`, `compatibility_date` must be `>= 2024-09-23`
- Check [Nitro changelog](https://github.com/unjs/nitro/releases) for what changed
- Pin to the latest date that works with your deployment target

**Real-world impact:** A `compatibilityDate` change can affect:

- WASM module loading behavior
- Node.js API compatibility layer
- Response header defaults
