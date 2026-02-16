---
title: Composables Export Functions Only, Not Types
impact: HIGH
impactDescription: Prevents type pollution and maintains clean architecture
tags: composables, types, organization, exports
---

## Composables Export Functions Only, Not Types

Composable files should ONLY export functions. Import types from dedicated type files.

**Incorrect (exporting types from composables):**

```typescript
// ❌ WRONG - app/composables/auth/use-oauth.ts
export type OAuthProviderId = 'google' | 'github' | 'discord'

export interface OAuthProviderInfo {
  id: OAuthProviderId
  name: string
  icon: string
}

export function useOAuthProviders() {
  const providers: OAuthProviderInfo[] = [...]
  return { providers }
}
```

```typescript
// Then awkward imports
import { useOAuthProviders, type OAuthProviderId } from '~/composables/auth/use-oauth'
```

**Correct (types in dedicated files):**

```typescript
// ✅ CORRECT - shared/types/auth.ts
export type OAuthProviderId = 'google' | 'github' | 'discord'

export interface OAuthProviderInfo {
  id: OAuthProviderId
  name: string
  icon: string
}
```

```typescript
// ✅ CORRECT - app/composables/auth/use-oauth.ts
import type { OAuthProviderId, OAuthProviderInfo } from '#shared/types/auth'

export function useOAuthProviders() {
  const providers: OAuthProviderInfo[] = [...]
  return { providers }
}
```

```typescript
// Clean imports in components
import type { OAuthProviderId } from '#shared/types/auth'
// useOAuthProviders is auto-imported
const { providers } = useOAuthProviders()
```

**Benefits of separation:**

```typescript
// Types can be imported without function overhead
import type { User, Session } from '#shared/types/auth'

// Composables are auto-imported in components
const { user, login, logout } = useAuth()

// Server code can import types without client composable code
// server/api/auth.ts
import type { User } from '#shared/types/auth'
```

**Return types for composables:**

```typescript
// Define return type interface in types file
// app/types/auth.ts
import type { Ref, ComputedRef } from 'vue'
import type { User } from '#shared/types/auth'

export interface UseAuthReturn {
  user: Ref<User | null>
  isAuthenticated: ComputedRef<boolean>
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}
```

```typescript
// Composable uses the return type
// app/composables/auth/use-auth.ts
import type { UseAuthReturn } from '~/types/auth'

export function useAuth(): UseAuthReturn {
  // Implementation
}
```

**What composables CAN export:**

| Export Type | OK? | Notes |
|-------------|-----|-------|
| Functions (composables) | ✅ | Primary export |
| Constants | ⚠️ | Move to separate constants file |
| Types/Interfaces | ❌ | Move to types directory |
| Classes | ❌ | Move to utils or services |

Reference: [Nuxt Composables](https://nuxt.com/docs/guide/directory-structure/composables)
