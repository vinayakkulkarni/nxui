---
title: Use Correct Import Paths (#shared, ~/, ~~/)
impact: MEDIUM
impactDescription: Ensures imports resolve correctly across client and server
tags: types, imports, paths, aliases, nuxt
---

## Use Correct Import Paths (#shared, ~/, ~~/)

Nuxt provides specific import aliases for different contexts. Using the wrong alias can cause build errors or runtime issues.

**Incorrect (wrong import paths):**

```typescript
// ❌ WRONG - Relative paths for shared types
import type { User } from '../../../shared/types/auth'
import type { ApiToken } from '../../shared/types/token'

// ❌ WRONG - Using ~/shared instead of #shared
import type { User } from '~/shared/types/auth'

// ❌ WRONG - Accessing server types from client
// In a Vue component:
import type { InternalConfig } from '~/server/types/internal'
```

**Correct (proper aliases):**

```typescript
// ✅ CORRECT - Shared types (client & server)
import type { User, Session } from '#shared/types/auth'
import type { ApiToken, TokenMetadata } from '#shared/types/token'

// ✅ CORRECT - Frontend/app types
import type { TierInfo } from '~/types/billing'
import type { NavItem } from '~/types/navigation'

// ✅ CORRECT - Server types (only in server code)
import type { InternalConfig } from '~~/server/types/internal'

// ✅ CORRECT - Shared schemas
import { createUserSchema } from '#shared/schemas/user'

// ✅ CORRECT - Shared utilities
import { formatDate } from '#shared/utils/date'
```

**Import alias reference:**

| Alias | Resolves To | Use In | Example |
|-------|-------------|--------|---------|
| `#shared` | `shared/` | Client & Server | `#shared/types/auth` |
| `~/` | `app/` | Client code | `~/types/billing` |
| `~~/` | Project root | Server code | `~~/server/types/` |
| `#imports` | Auto-imports | Anywhere | `#imports` |

**Configure shared alias in nuxt.config:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  alias: {
    '#shared': '../shared'  // If shared is at project root
  },
  // Or use layers
  extends: ['./shared']
})
```

**Type-only imports:**

```typescript
// Always use 'import type' for types
import type { User } from '#shared/types/auth'  // ✅ Correct
import { User } from '#shared/types/auth'        // ⚠️ Works but less explicit

// For mixed imports
import { userSchema, type User } from '#shared/schemas/user'
```

**Avoid inline import():**

```typescript
// ❌ WRONG - Inline import in type annotation
export interface ApiErrorData {
  errorCode?: import('~/types/embed').EmbedErrorCode  // NO!
}

// ✅ CORRECT - Top-level import type
import type { EmbedErrorCode } from '~/types/embed'

export interface ApiErrorData {
  errorCode?: EmbedErrorCode
}
```

**Server-only imports:**

```typescript
// server/api/users.get.ts

// ✅ These work in server context
import { useDrizzle } from '~~/server/utils/db'
import type { DatabaseUser } from '~~/server/types/database'

// ✅ Shared types work everywhere
import type { User } from '#shared/types/auth'

// ❌ Don't import app/ in server code
import { useAuth } from '~/composables/auth'  // NO!
```

Reference: [Nuxt Alias](https://nuxt.com/docs/api/nuxt-config#alias)
