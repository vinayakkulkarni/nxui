---
title: Understand Barrel Export Rules for Auto-Imported Directories
impact: CRITICAL
impactDescription: Prevents duplicate import warnings and enables proper auto-imports
tags: auto-imports, barrel-exports, organization, nuxt
---

## Understand Barrel Export Rules for Auto-Imported Directories

Nuxt auto-imports from specific directories. The rules for barrel exports (`index.ts`) differ by directory type.

**How Nuxt auto-imports work:**

| Directory | Scan Behavior | Barrel Needed? |
|-----------|--------------|----------------|
| `composables/` | Top-level only | Yes, for nested |
| `utils/` | Top-level only | Yes, for nested |
| `server/utils/` | Recursive | No (causes duplicates) |
| `components/` | Recursive | No |

**Incorrect (barrel in recursively-scanned directory):**

```typescript
// ❌ WRONG - server/utils/admin/index.ts
// server/utils/ is scanned RECURSIVELY - barrel causes duplicates!
export { getAIUsageMetrics } from './ai-usage'
export { getUserAnalytics } from './user-analytics'
// Warning: "Duplicate import: getAIUsageMetrics"
```

**Correct (let recursive scan handle it):**

```typescript
// ✅ CORRECT - server/utils/admin/ai-usage.ts
// No index.ts needed - Nuxt auto-imports recursively
export function getAIUsageMetrics() {
  // Automatically available in server code
}
```

**For composables - barrel at ROOT enables nested auto-imports:**

Per [official Nuxt docs](https://nuxt.com/docs/guide/directory-structure/composables#how-files-are-scanned), only files at the top level of `composables/` are auto-imported. To auto-import from nested directories, re-export from a root `index.ts`:

```typescript
// ✅ CORRECT - composables/index.ts (at ROOT)
// Required to enable auto-import of nested composables
export { useAuth, useSession } from './auth/use-auth'
export { useTokens } from './tokens/use-tokens'
export { useBilling } from './billing/use-billing'
```

```typescript
// ✅ CORRECT - composables/auth/use-auth.ts
export function useAuth() {
  // Now auto-importable because of root index.ts
}
```

**Do NOT create barrel exports at feature-subfolder level:**

```typescript
// ❌ WRONG - composables/auth/index.ts
// This creates circular dependencies and duplicates
export * from './use-auth'
export * from './use-session'

// ✅ CORRECT - Export directly from root composables/index.ts instead
```

**Summary:**

| Location | Barrel Export? | Reason |
|----------|---------------|--------|
| `composables/index.ts` | ✅ Yes | Enables nested auto-imports |
| `composables/auth/index.ts` | ❌ No | Causes duplicates/circular deps |
| `server/utils/**` | ❌ No | Recursive scan - duplicates |
| `utils/index.ts` | ✅ Yes | Enables nested auto-imports |
| `shared/types/index.ts` | ✅ Yes | Organization (not auto-imported) |

Reference: [Nuxt Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports) | [Composables Directory](https://nuxt.com/docs/guide/directory-structure/composables)
