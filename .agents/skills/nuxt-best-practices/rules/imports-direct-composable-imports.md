---
title: Use Direct Imports Between Composables
impact: HIGH
impactDescription: Prevents circular dependency warnings at build time
tags: composables, imports, circular-dependencies, organization
---

## Use Direct Imports Between Composables

In a flat top-level `composables/` layout, calling one composable from another via auto-import is officially supported and fine — Nuxt endorses it ("You can use a composable within another composable using auto imports").

This direct-import rule applies specifically WHEN you use a root `composables/index.ts` barrel to expose composables from nested subdirectories. In that setup, composable → composable calls must use direct relative imports to avoid a dependency cycle routed through the barrel.

**Incorrect (auto-import routed through the root barrel):**

```typescript
// ❌ WRONG - app/composables/dashboard/use-dashboard.ts
export function useDashboard() {
  // Auto-imported - creates circular dependency!
  const { tokens } = useTokens();
  const { totalUsage } = useUsage();
  const { user } = useAuth();

  return {
    // ...
  };
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
import { useTokens } from '../tokens/use-tokens';
import { useUsage } from '../usage/use-usage';
import { useAuth } from '../auth/use-auth';

export function useDashboard() {
  const { tokens } = useTokens();
  const { totalUsage } = useUsage();
  const { user } = useAuth();

  return {
    // ...
  };
}
```

**Why this happens:**

The root `composables/index.ts` barrel file re-exports all composables:

```typescript
// composables/index.ts (required only to auto-import composables in nested subdirectories)
export { useAuth } from './auth/use-auth';
export { useTokens } from './tokens/use-tokens';
export { useDashboard } from './dashboard/use-dashboard';
```

When composables use auto-import, they go through this barrel:

```
useDashboard -> auto-import -> composables/index.ts -> useTokens -> uses useDashboard?
```

**Import patterns:**

```typescript
// ✅ In composables - use relative imports
// app/composables/feature/use-feature.ts
import { useAuth } from '../auth/use-auth';
import { useToast } from '../toast/use-toast';

// ✅ In Vue components - use auto-import (or explicit)
// app/pages/dashboard.vue
const { user } = useAuth(); // Auto-imported
const { tokens } = useTokens(); // Auto-imported

// ✅ In server code - server/utils/ is auto-imported recursively,
// so helpers are already available without an explicit import
// server/api/data.ts
const result = someUtil(); // Auto-imported from server/utils/
```

**Common composable imports to add:**

```typescript
// app/composables/dashboard/use-dashboard.ts
import { useAuth, useSession } from '../auth/use-auth';
import { useTokens } from '../tokens/use-tokens';
import { useUsage } from '../usage/use-usage';
import { useBilling } from '../billing/use-billing';
import { useToast } from '../toast/use-toast';
```

**Rule summary:**

| Location                                  | Import Method   | Example                             |
| ----------------------------------------- | --------------- | ----------------------------------- |
| Composable → Composable (via root barrel) | Direct relative | `import { useAuth } from '../auth'` |
| Composable → Composable (flat top-level)  | Auto-import     | `const { user } = useAuth()`        |
| Component → Composable                    | Auto-import     | `const { user } = useAuth()`        |
| Server → Server util                      | Auto-import     | `const x = someUtil()`              |

Reference: [Nuxt Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports)
