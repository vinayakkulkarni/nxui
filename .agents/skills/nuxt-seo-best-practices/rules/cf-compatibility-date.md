---
title: Pin compatibilityDate, Never Use 'latest'
impact: HIGH
impactDescription: Prevents unpredictable Nitro behavior changes between builds
tags: cloudflare, nitro, nuxt-config, compatibility, deployment
---

## Pin compatibilityDate, Never Use 'latest'

Nuxt's `compatibilityDate` controls which Nitro runtime behaviors are active. Using `'latest'` resolves to a different date on every build, which can silently change how your app behaves in production.

**Incorrect (using 'latest'):**

```typescript
// ❌ WRONG — 'latest' resolves to a different date on each build
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  // Today it might be 2025-07-18, tomorrow 2025-07-19
  // Each date can change Nitro's internal behavior
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

- Use the date of your current Nuxt release
- Check [Nitro changelog](https://github.com/unjs/nitro/releases) for what changed
- Pin to the latest date that works with your deployment target

**Real-world impact:** A `compatibilityDate` change can affect:

- How `process.env` is handled in server routes
- WASM module loading behavior
- Node.js API compatibility layer
- Response header defaults
