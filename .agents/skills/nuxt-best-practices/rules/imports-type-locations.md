---
title: Place Types in Dedicated Directories
impact: CRITICAL
impactDescription: Maintains clear separation and correct import paths
tags: types, organization, imports, architecture
---

## Place Types in Dedicated Directories

Never define interfaces or types inline in components, composables, or API files. Place them in dedicated type directories.

**Incorrect (inline types):**

```vue
<!-- ❌ WRONG - app/components/auth/OAuthButtons.vue -->
<script setup lang="ts">
// NO! Types don't belong in components!
interface ProviderConfig {
  icon: string
  buttonClass: string
}

const providers: ProviderConfig[] = [...]
</script>
```

```typescript
// ❌ WRONG - app/composables/billing/use-billing.ts
// NO! Types don't belong in composables!
export interface TierInfo {
  name: string
  price: number
}

export function useBilling() { ... }
```

```typescript
// ❌ WRONG - server/utils/auth.ts
// NO! Shared types go in shared/types/
export type OAuthProviderId = 'google' | 'github'
```

**Correct (dedicated type directories):**

```
project/
├── app/
│   └── types/                    # Frontend-only UI types
│       ├── auth.ts               # OAuthProviderUIConfig, LoginFormState
│       ├── billing.ts            # TierInfo, ButtonConfig
│       └── navigation.ts         # SidebarState, NavItem
├── shared/
│   └── types/                    # Shared between client & server
│       ├── auth.ts               # User, Session, OAuthProviderId
│       ├── token.ts              # ApiToken, TokenMetadata
│       └── api.ts                # ApiResponse, PaginatedResponse
└── server/
    └── types/                    # Server-only types
        ├── internal.ts           # InternalConfig, MiddlewareContext
        └── database.ts           # DatabaseRow, QueryResult
```

**Import paths:**

```typescript
// Frontend types (from app/types/)
import type { OAuthProviderUIConfig } from '~/types/auth'
import type { TierInfo } from '~/types/billing'

// Shared types (from shared/types/)
import type { User, Session } from '#shared/types/auth'
import type { ApiToken } from '#shared/types/token'

// Server types (from server/types/)
import type { InternalConfig } from '~~/server/types/internal'
```

**Type location decision table:**

| Type Category | Location | Import Path | Examples |
|--------------|----------|-------------|----------|
| UI component props | `app/types/` | `~/types/...` | Form state, display config |
| API request/response | `shared/types/` | `#shared/types/...` | User, ApiToken, responses |
| Database entities | `shared/types/` | `#shared/types/...` | DB models used by both |
| Server internals | `server/types/` | `~~/server/types/...` | Middleware context, internal config |

**Why this matters:**

1. **Clarity**: Know where to find and add types
2. **Sharing**: Shared types work on both client and server
3. **Bundle size**: Server types aren't bundled to client
4. **Maintainability**: Types are organized by domain, not scattered

Reference: [Nuxt TypeScript](https://nuxt.com/docs/guide/concepts/typescript)
