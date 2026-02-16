---
title: Use Direct Imports Between Composables
impact: HIGH
impactDescription: Prevents circular dependency warnings at build time
tags: composables, imports, circular-dependencies, organization
---

## Use Direct Imports Between Composables

When a composable calls another composable, use direct relative imports, NOT Nuxt's auto-import. This prevents circular dependency warnings.

**Incorrect (auto-import between composables):**

```typescript
// ❌ WRONG - app/composables/dashboard/use-dashboard.ts
export function useDashboard() {
  // Auto-imported - creates circular dependency!
  const { tokens } = useTokens()
  const { totalUsage } = useUsage()
  const { user } = useAuth()
  
  return {
    // ...
  }
}
```

Build warning:
```
[warn] Circular dependency:
  composables/dashboard/use-dashboard.ts ->
  composables/index.ts ->
  composables/tokens/use-tokens.ts ->
  composables/index.ts
```

**Correct (direct imports):**

```typescript
// ✅ CORRECT - app/composables/dashboard/use-dashboard.ts
import { useTokens } from '../tokens/use-tokens'
import { useUsage } from '../usage/use-usage'
import { useAuth } from '../auth/use-auth'

export function useDashboard() {
  const { tokens } = useTokens()
  const { totalUsage } = useUsage()
  const { user } = useAuth()
  
  return {
    // ...
  }
}
```

**Why this happens:**

The root `composables/index.ts` barrel file re-exports all composables:

```typescript
// composables/index.ts (required for Nuxt auto-import)
export { useAuth } from './auth/use-auth'
export { useTokens } from './tokens/use-tokens'
export { useDashboard } from './dashboard/use-dashboard'
```

When composables use auto-import, they go through this barrel:
```
useDashboard -> auto-import -> composables/index.ts -> useTokens -> uses useDashboard?
```

**Import patterns:**

```typescript
// ✅ In composables - use relative imports
// app/composables/feature/use-feature.ts
import { useAuth } from '../auth/use-auth'
import { useToast } from '../toast/use-toast'

// ✅ In Vue components - use auto-import (or explicit)
// app/pages/dashboard.vue
const { user } = useAuth()  // Auto-imported
const { tokens } = useTokens()  // Auto-imported

// ✅ In server code - import explicitly
// server/api/data.ts
import { someUtil } from '~~/server/utils/helpers'
```

**Common composable imports to add:**

```typescript
// app/composables/dashboard/use-dashboard.ts
import { useAuth, useSession } from '../auth/use-auth'
import { useTokens } from '../tokens/use-tokens'
import { useUsage } from '../usage/use-usage'
import { useBilling } from '../billing/use-billing'
import { useToast } from '../toast/use-toast'
```

**Rule summary:**

| Location | Import Method | Example |
|----------|--------------|---------|
| Composable → Composable | Direct relative | `import { useAuth } from '../auth'` |
| Component → Composable | Auto-import | `const { user } = useAuth()` |
| Server → Server util | Direct with alias | `import { x } from '~~/server/utils'` |

Reference: [Nuxt Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports)
