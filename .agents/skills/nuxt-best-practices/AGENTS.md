# Nuxt Best Practices - Complete Reference

> This file is auto-generated. Do not edit directly.
> Edit individual rule files in the `rules/` directory and run `bun run build`.

# Nuxt Best Practices

Comprehensive performance optimization guide for Nuxt 3/4 applications. Contains 40+ rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new Nuxt pages, components, or composables
- Implementing data fetching (useFetch, useAsyncData)
- Creating server routes and API endpoints
- Organizing types, composables, and auto-imports
- Working with Nuxt modules and plugins
- Configuring rendering modes (SSR, SSG, SPA)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Data Fetching | CRITICAL | `data-` |
| 2 | Auto-Imports & Organization | CRITICAL | `imports-` |
| 3 | Server & API Routes | HIGH | `server-` |
| 4 | Rendering Modes | HIGH | `rendering-` |
| 5 | State Management | MEDIUM-HIGH | `state-` |
| 6 | Type Safety | MEDIUM | `types-` |
| 7 | Modules & Plugins | LOW-MEDIUM | `modules-` |
| 8 | Performance & Deployment | LOW | `perf-` |

## Quick Reference

### 1. Data Fetching (CRITICAL)

- `data-use-fetch` - Use useFetch/useAsyncData, never raw fetch in components
- `data-key-unique` - Always provide unique keys for data fetching
- `data-lazy-loading` - Use lazy option for non-critical data
- `data-transform` - Transform data at fetch time, not in template
- `data-error-handling` - Always handle error and pending states
- `data-refresh-patterns` - Use refresh() and clear() appropriately

### 2. Auto-Imports & Organization (CRITICAL)

- `imports-no-barrel-autoimport` - Never create barrel exports in auto-imported directories
- `imports-component-naming` - Don't duplicate folder prefix in component names
- `imports-type-locations` - Place types in dedicated directories (app/types, shared/types, server/types)
- `imports-composable-exports` - Composables export functions only, not types
- `imports-direct-composable-imports` - Use direct imports between composables

### 3. Server & API Routes (HIGH)

- `server-validated-input` - Use getValidatedQuery/readValidatedBody with Zod
- `server-route-meta` - Always add defineRouteMeta for OpenAPI docs
- `server-runtime-config` - Use useRuntimeConfig, never process.env
- `server-error-handling` - Use createError for consistent error responses
- `server-middleware-order` - Understand middleware execution order

### 4. Rendering Modes (HIGH)

- `rendering-route-rules` - Configure rendering per-route with routeRules
- `rendering-hybrid` - Use hybrid rendering for optimal performance
- `rendering-prerender` - Prerender static pages at build time
- `rendering-client-only` - Use ClientOnly for browser-specific components

### 5. State Management (MEDIUM-HIGH)

- `state-use-state` - Use useState for SSR-safe shared state
- `state-pinia-setup` - Set up Pinia correctly with Nuxt
- `state-hydration` - Handle hydration mismatches properly
- `state-computed-over-watch` - Prefer computed over watch for derived state

### 6. Type Safety (MEDIUM)

- `types-no-inline` - Never define types inline in components/composables
- `types-import-paths` - Use correct import paths (#shared, ~/, ~~/)
- `types-no-any` - Never use `any` type
- `types-zod-schemas` - Use Zod for runtime validation with type inference
- `types-strict-emits` - Use kebab-case emits with full type definitions

### 7. Modules & Plugins (LOW-MEDIUM)

- `modules-order` - Module order matters in nuxt.config
- `modules-runtime-vs-build` - Understand runtime vs build-time modules
- `plugins-client-server` - Use .client.ts and .server.ts suffixes correctly
- `plugins-provide-inject` - Use provide/inject for cross-cutting concerns

### 8. Performance & Deployment (LOW)

- `perf-bundle-analysis` - Analyze and optimize bundle size
- `perf-image-optimization` - Use nuxt/image for optimized images
- `perf-font-loading` - Configure font loading strategy
- `perf-caching-headers` - Set appropriate cache headers

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/data-use-fetch.md
rules/imports-no-barrel-autoimport.md
rules/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and Nuxt-specific notes

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

---

# Detailed Rules

### Always Handle Error and Pending States

**Impact:** HIGH - Prevents blank screens and improves UX

## Always Handle Error and Pending States

Data fetching can fail or take time. Always handle `error` and `status`/`pending` states to provide good user experience.

**Incorrect (no error/loading handling):**

```vue
<script setup>
// BAD: No handling of errors or loading states
const { data: users } = await useFetch('/api/users')
</script>

<template>
  <!-- Crashes if data is null, no loading indicator -->
  <ul>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**Correct (full state handling):**

```vue
<script setup>
const { data: users, status, error, refresh } = await useFetch('/api/users', {
  default: () => []
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="status === 'pending'" class="loading">
    <Spinner />
    <p>Loading users...</p>
  </div>
  
  <!-- Error state with retry -->
  <div v-else-if="error" class="error">
    <p>Failed to load users: {{ error.message }}</p>
    <button @click="refresh()">Try Again</button>
  </div>
  
  <!-- Empty state -->
  <div v-else-if="users.length === 0" class="empty">
    <p>No users found</p>
  </div>
  
  <!-- Success state -->
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**Status values:**

| Status | Description |
|--------|-------------|
| `idle` | No request made yet |
| `pending` | Request in progress |
| `success` | Request completed successfully |
| `error` | Request failed |

**Using NuxtErrorBoundary for global error handling:**

```vue
<template>
  <NuxtErrorBoundary>
    <template #default>
      <UserList />
    </template>
    <template #error="{ error, clearError }">
      <div class="error-page">
        <h2>Something went wrong</h2>
        <p>{{ error.message }}</p>
        <button @click="clearError()">Try Again</button>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>
```

**Lazy fetch with separate loading:**

```vue
<script setup>
// Lazy fetch - doesn't block navigation
const { data: stats, status } = useLazyFetch('/api/stats')
</script>

<template>
  <main>
    <!-- Main content renders immediately -->
    <h1>Dashboard</h1>
    
    <!-- Stats load asynchronously -->
    <aside>
      <Skeleton v-if="status === 'pending'" />
      <StatsCard v-else :stats="stats" />
    </aside>
  </main>
</template>
```

**Composable pattern for reusable error handling:**

```typescript
// composables/useFetchWithNotification.ts
export function useFetchWithNotification<T>(
  url: string,
  options?: UseFetchOptions<T>
) {
  const toast = useToast()
  
  const result = useFetch(url, {
    ...options,
    onResponseError: ({ response }) => {
      toast.error(response._data?.message || 'Request failed')
      options?.onResponseError?.({ response })
    }
  })
  
  return result
}
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)

---

### Always Provide Unique Keys for Data Fetching

**Impact:** CRITICAL - Prevents cache collisions and stale data

## Always Provide Unique Keys for Data Fetching

Nuxt uses keys to cache and deduplicate data fetching. Without unique keys, different data can share the same cache entry, causing stale or incorrect data.

**Incorrect (missing or non-unique keys):**

```vue
<script setup>
const props = defineProps<{ userId: string }>()

// BAD: Auto-generated key doesn't include userId
// All user profiles share the same cache!
const { data: profile } = await useFetch('/api/profile')

// BAD: useAsyncData without key
const { data: orders } = await useAsyncData(async () => {
  return await fetchOrders(props.userId)
})
</script>
```

**Correct (unique keys):**

```vue
<script setup>
const props = defineProps<{ userId: string }>()

// GOOD: Include dynamic values in the URL
const { data: profile } = await useFetch(`/api/users/${props.userId}/profile`)

// GOOD: Or provide explicit key
const { data: profile } = await useFetch('/api/profile', {
  key: `profile-${props.userId}`,
  query: { userId: props.userId }
})

// GOOD: useAsyncData with unique key
const { data: orders } = await useAsyncData(
  `orders-${props.userId}`, // Unique key
  () => fetchOrders(props.userId)
)
</script>
```

**Key patterns for common scenarios:**

```vue
<script setup>
// List with pagination
const page = ref(1)
const { data } = await useFetch('/api/items', {
  key: `items-page-${page.value}`,
  query: { page }
})

// Detail page
const route = useRoute()
const { data } = await useFetch(`/api/items/${route.params.id}`, {
  key: `item-${route.params.id}`
})

// Filtered data
const filters = reactive({ status: 'active', category: 'tech' })
const { data } = await useFetch('/api/items', {
  key: computed(() => `items-${JSON.stringify(filters)}`),
  query: filters
})
</script>
```

**Watch for reactive key changes:**

```vue
<script setup>
const selectedId = ref('123')

// Automatically refetches when key changes
const { data } = await useFetch(() => `/api/items/${selectedId.value}`)

// Or use watch option with explicit key
const { data } = await useFetch('/api/items', {
  key: () => `item-${selectedId.value}`,
  query: { id: selectedId },
  watch: [selectedId]
})
</script>
```

**Avoid dynamic keys in loops:**

```vue
<script setup>
// BAD: Creates many parallel requests
const items = ref(['a', 'b', 'c'])
// Don't do this in a loop!
for (const id of items.value) {
  await useFetch(`/api/items/${id}`) // Anti-pattern
}

// GOOD: Fetch all at once
const { data } = await useFetch('/api/items', {
  query: { ids: items.value.join(',') }
})
</script>
```

Reference: [Nuxt Data Fetching - Keys](https://nuxt.com/docs/getting-started/data-fetching#keys)

---

### Transform Data at Fetch Time, Not in Template

**Impact:** HIGH - Reduces payload size and avoids repeated transformations

## Transform Data at Fetch Time, Not in Template

Transform and filter data in useFetch options rather than in templates or computed properties. This reduces the payload sent to the client and avoids repeated transformations.

**Incorrect (transform in template/computed):**

```vue
<script setup>
// BAD: Full response sent to client, transformed on every render
const { data: response } = await useFetch('/api/users')

// Computed runs on every access
const users = computed(() => 
  response.value?.data?.users?.map(u => ({
    id: u.id,
    displayName: `${u.firstName} ${u.lastName}`,
    avatar: u.profile?.avatar || '/default.png'
  })) ?? []
)
</script>

<template>
  <!-- Even worse: transform in template -->
  <div v-for="user in response?.data?.users" :key="user.id">
    {{ user.firstName }} {{ user.lastName }}
  </div>
</template>
```

**Correct (transform at fetch time):**

```vue
<script setup>
interface User {
  id: string
  displayName: string
  avatar: string
}

// GOOD: Transform happens once, smaller payload to client
const { data: users } = await useFetch<User[]>('/api/users', {
  transform: (response) => 
    response.data.users.map(u => ({
      id: u.id,
      displayName: `${u.firstName} ${u.lastName}`,
      avatar: u.profile?.avatar || '/default.png'
    })),
  default: () => []
})
</script>

<template>
  <div v-for="user in users" :key="user.id">
    {{ user.displayName }}
    <img :src="user.avatar" />
  </div>
</template>
```

**Use pick for simple field selection:**

```vue
<script setup>
// Only these fields are sent to the client
const { data: users } = await useFetch('/api/users', {
  pick: ['id', 'name', 'email']
})

// For nested picking with transform
const { data: user } = await useFetch(`/api/users/${id}`, {
  transform: (response) => ({
    id: response.id,
    name: response.name,
    // Exclude sensitive/large fields like password, fullProfile, etc.
  })
})
</script>
```

**Combine transform with default:**

```vue
<script setup>
interface PaginatedUsers {
  items: User[]
  total: number
  hasMore: boolean
}

const { data } = await useFetch<PaginatedUsers>('/api/users', {
  query: { page: page.value },
  transform: (response) => ({
    items: response.data.map(formatUser),
    total: response.meta.total,
    hasMore: response.meta.page < response.meta.totalPages
  }),
  default: () => ({
    items: [],
    total: 0,
    hasMore: false
  })
})
</script>
```

**Transform for error normalization:**

```vue
<script setup>
const { data, error } = await useFetch('/api/data', {
  transform: (response) => response.data,
  onResponseError: ({ response }) => {
    // Normalize error format
    throw createError({
      statusCode: response.status,
      message: response._data?.message || 'Unknown error'
    })
  }
})
</script>
```

Reference: [useFetch - Options](https://nuxt.com/docs/api/composables/use-fetch#options)

---

### Use useFetch/useAsyncData, Never Raw fetch in Components

**Impact:** CRITICAL - Prevents hydration errors and enables SSR caching

## Use useFetch/useAsyncData, Never Raw fetch in Components

Nuxt's data fetching composables handle SSR, caching, deduplication, and hydration automatically. Using raw `fetch` in components causes hydration mismatches and duplicate requests.

**Incorrect (raw fetch in component):**

```vue
<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(true)

// BAD: Raw fetch causes hydration mismatch and duplicate requests
onMounted(async () => {
  const response = await fetch('/api/users')
  users.value = await response.json()
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**Correct (useFetch):**

```vue
<script setup>
// GOOD: useFetch handles SSR, caching, and hydration
const { data: users, status, error } = await useFetch('/api/users')
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

**For custom data sources (not HTTP), use useAsyncData:**

```vue
<script setup>
// useAsyncData for non-fetch async operations
const { data: config } = await useAsyncData('config', async () => {
  const settings = await loadSettings()
  const features = await getFeatureFlags()
  return { settings, features }
})
</script>
```

**When you need more control:**

```vue
<script setup>
const { data, refresh, clear, status } = await useFetch('/api/users', {
  // Transform response
  transform: (response) => response.users,
  // Pick specific fields (reduces payload)
  pick: ['id', 'name', 'email'],
  // Default value
  default: () => [],
  // Watch for reactive dependencies
  watch: [page, filters],
  // Custom key for caching
  key: `users-${page.value}`
})
</script>
```

**Lazy loading for non-critical data:**

```vue
<script setup>
// useLazyFetch doesn't block navigation
const { data: recommendations, status } = useLazyFetch('/api/recommendations')

// Or with lazy option
const { data: stats } = await useFetch('/api/stats', { lazy: true })
</script>
```

**When raw fetch IS acceptable:**

- Inside server routes (`server/api/*.ts`)
- Inside event handlers (after user interaction)
- Inside server utilities

Reference: [Nuxt Data Fetching](https://nuxt.com/docs/getting-started/data-fetching)

---

### Don't Duplicate Folder Prefix in Component Names

**Impact:** CRITICAL - Prevents redundant component names like TokensTokenCard

## Don't Duplicate Folder Prefix in Component Names

Nuxt auto-imports components with the folder path as a prefix. Don't repeat the folder name in the filename.

**Incorrect (redundant naming):**

```
components/
└── tokens/
    └── TokenCard.vue       → <TokensTokenCard />  ❌ "Token" appears twice!
    └── TokenEmptyState.vue → <TokensTokenEmptyState />  ❌ Redundant
    └── TokenCreateDialog.vue → <TokensTokenCreateDialog />  ❌
```

```vue
<template>
  <!-- Awkward usage -->
  <TokensTokenCard :token="token" />
  <TokensTokenEmptyState v-if="!tokens.length" />
</template>
```

**Correct (clean naming):**

```
components/
└── tokens/
    └── Card.vue            → <TokensCard />       ✅
    └── EmptyState.vue      → <TokensEmptyState />  ✅
    └── CreateDialog.vue    → <TokensCreateDialog /> ✅
```

```vue
<template>
  <!-- Clean usage -->
  <TokensCard :token="token" />
  <TokensEmptyState v-if="!tokens.length" />
</template>
```

**How Nuxt builds component names:**

```
components/
├── Header.vue                    → <Header />
├── Footer.vue                    → <Footer />
├── dashboard/
│   ├── Stats.vue                 → <DashboardStats />
│   ├── Chart.vue                 → <DashboardChart />
│   └── widgets/
│       ├── Revenue.vue           → <DashboardWidgetsRevenue />
│       └── Users.vue             → <DashboardWidgetsUsers />
├── auth/
│   ├── LoginForm.vue             → <AuthLoginForm />
│   └── SignupForm.vue            → <AuthSignupForm />
└── ui/
    ├── Button.vue                → <UiButton />
    ├── Input.vue                 → <UiInput />
    └── Modal.vue                 → <UiModal />
```

**Naming Convention Table:**

| Path | Component Usage | Notes |
|------|-----------------|-------|
| `Button.vue` | `<Button />` | Root level |
| `ui/Button.vue` | `<UiButton />` | Folder prefix |
| `ui/form/Input.vue` | `<UiFormInput />` | Nested folders |
| `dashboard/cards/Stats.vue` | `<DashboardCardsStats />` | Deep nesting |

**For shared/global components:**

```
components/
├── global/           # Or just root level
│   ├── Button.vue    → <Button /> or <GlobalButton />
│   └── Icon.vue      → <Icon /> or <GlobalIcon />
```

**Custom prefix configuration:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  components: {
    dirs: [
      {
        path: '~/components/ui',
        prefix: '' // No prefix for UI components
      }
    ]
  }
})
```

Reference: [Nuxt Components Directory](https://nuxt.com/docs/guide/directory-structure/components)

---

### Composables Export Functions Only, Not Types

**Impact:** HIGH - Prevents type pollution and maintains clean architecture

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

---

### Use Direct Imports Between Composables

**Impact:** HIGH - Prevents circular dependency warnings at build time

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

---

### Understand Barrel Export Rules for Auto-Imported Directories

**Impact:** CRITICAL - Prevents duplicate import warnings and enables proper auto-imports

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

---

### Place Types in Dedicated Directories

**Impact:** CRITICAL - Maintains clear separation and correct import paths

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

---

### Use ClientOnly for Browser-Specific Components

**Impact:** HIGH - Prevents SSR errors and hydration mismatches

## Use ClientOnly for Browser-Specific Components

Components that use browser-only APIs (window, document, localStorage, etc.) must be wrapped in `<ClientOnly>` or use the `.client.vue` suffix to prevent SSR errors.

**Incorrect (browser APIs in SSR):**

```vue
<!-- ❌ WRONG - This crashes on server -->
<script setup>
// window is not defined on server!
const width = ref(window.innerWidth)

// localStorage doesn't exist on server!
const saved = localStorage.getItem('settings')
</script>
```

```vue
<!-- ❌ WRONG - Third-party library uses window -->
<template>
  <!-- This chart library accesses window internally -->
  <ChartComponent :data="data" />
</template>
```

**Correct (using ClientOnly):**

```vue
<template>
  <!-- Wrap browser-only components -->
  <ClientOnly>
    <ChartComponent :data="data" />
    
    <template #fallback>
      <div class="chart-placeholder">Loading chart...</div>
    </template>
  </ClientOnly>
</template>
```

**Correct (using .client.vue suffix):**

```
components/
├── Chart.client.vue    # Only renders on client
├── Analytics.client.vue
└── Map.client.vue
```

```vue
<!-- Chart.client.vue - automatically client-only -->
<script setup>
// Safe to use browser APIs here
const canvas = ref<HTMLCanvasElement>()

onMounted(() => {
  const ctx = canvas.value?.getContext('2d')
  // Initialize chart...
})
</script>
```

**Safe browser API access:**

```vue
<script setup>
// ✅ CORRECT - Check for client before using browser APIs
const width = ref(0)
const savedSettings = ref<Settings | null>(null)

onMounted(() => {
  // This only runs on client
  width.value = window.innerWidth
  savedSettings.value = JSON.parse(localStorage.getItem('settings') || '{}')
})

// Or use import.meta.client
if (import.meta.client) {
  // Browser-only code
}
</script>
```

**Using VueUse for SSR-safe utilities:**

```vue
<script setup>
import { useWindowSize, useLocalStorage, useMediaQuery } from '@vueuse/core'

// These are SSR-safe!
const { width, height } = useWindowSize()
const settings = useLocalStorage('settings', { theme: 'light' })
const isMobile = useMediaQuery('(max-width: 768px)')
</script>
```

**Common browser-only scenarios:**

| Scenario | Solution |
|----------|----------|
| Charts (Chart.js, ECharts) | `<ClientOnly>` or `.client.vue` |
| Maps (MapLibre, Leaflet) | `<ClientOnly>` or `.client.vue` |
| Rich text editors | `<ClientOnly>` |
| Canvas/WebGL | `<ClientOnly>` or `onMounted` |
| localStorage/sessionStorage | `useLocalStorage` from VueUse |
| window.matchMedia | `useMediaQuery` from VueUse |
| IntersectionObserver | `useIntersectionObserver` from VueUse |

**Lazy loading client-only components:**

```vue
<script setup>
// Lazy load heavy client-only component
const HeavyChart = defineAsyncComponent(() => 
  import('~/components/HeavyChart.client.vue')
)
</script>

<template>
  <ClientOnly>
    <Suspense>
      <HeavyChart :data="data" />
      <template #fallback>
        <Skeleton />
      </template>
    </Suspense>
  </ClientOnly>
</template>
```

Reference: [Nuxt ClientOnly](https://nuxt.com/docs/api/components/client-only)

---

### Use createError for Consistent Error Responses

**Impact:** HIGH - Ensures consistent error format across all API endpoints

## Use createError for Consistent Error Responses

Use Nuxt's `createError` utility for all API errors. It provides consistent error format, proper HTTP status codes, and integrates with Nuxt's error handling.

**Incorrect (throwing raw errors):**

```typescript
// ❌ WRONG - Inconsistent error handling
export default defineEventHandler(async (event) => {
  const user = await getUser(event)
  
  if (!user) {
    throw new Error('User not found')  // Generic 500 error
  }
  
  // Or worse
  return { error: 'Not found', status: 404 }  // Inconsistent format
})
```

**Correct (using createError):**

```typescript
// ✅ CORRECT - server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const user = await getUser(id)
  
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: `User with ID ${id} not found`
    })
  }
  
  return user
})
```

**Common error patterns:**

```typescript
// 400 Bad Request - Invalid input
throw createError({
  statusCode: 400,
  statusMessage: 'Bad Request',
  message: 'Invalid email format',
  data: {
    field: 'email',
    reason: 'Must be a valid email address'
  }
})

// 401 Unauthorized - Not authenticated
throw createError({
  statusCode: 401,
  statusMessage: 'Unauthorized',
  message: 'Authentication required'
})

// 403 Forbidden - Not authorized
throw createError({
  statusCode: 403,
  statusMessage: 'Forbidden',
  message: 'You do not have permission to access this resource'
})

// 404 Not Found
throw createError({
  statusCode: 404,
  statusMessage: 'Not Found',
  message: 'Resource not found'
})

// 409 Conflict - Duplicate
throw createError({
  statusCode: 409,
  statusMessage: 'Conflict',
  message: 'Email already registered'
})

// 422 Unprocessable Entity - Validation
throw createError({
  statusCode: 422,
  statusMessage: 'Unprocessable Entity',
  message: 'Validation failed',
  data: {
    errors: validationErrors
  }
})

// 500 Internal Server Error
throw createError({
  statusCode: 500,
  statusMessage: 'Internal Server Error',
  message: 'An unexpected error occurred'
})
```

**Error response helper:**

```typescript
// server/utils/errors.ts
export function notFound(resource: string, id?: string) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: id ? `${resource} with ID ${id} not found` : `${resource} not found`
  })
}

export function unauthorized(message = 'Authentication required') {
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message
  })
}

export function forbidden(message = 'Permission denied') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
    message
  })
}

export function badRequest(message: string, data?: unknown) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    message,
    data
  })
}
```

```typescript
// Usage in handlers
export default defineEventHandler(async (event) => {
  const user = await getUser(id)
  if (!user) notFound('User', id)
  
  if (!canAccess(user)) forbidden()
  
  return user
})
```

**Client-side error handling:**

```vue
<script setup>
const { data, error } = await useFetch('/api/users/123')

if (error.value) {
  // error.value has shape: { statusCode, statusMessage, message, data }
  console.error(error.value.message)
}
</script>
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)

---

### Always Add defineRouteMeta for OpenAPI Documentation

**Impact:** HIGH - Enables automatic API documentation generation

## Always Add defineRouteMeta for OpenAPI Documentation

Every API endpoint MUST have `defineRouteMeta` for OpenAPI documentation. This enables automatic API docs generation and helps consumers understand your API.

**Incorrect (missing route metadata):**

```typescript
// ❌ WRONG - server/api/tokens.post.ts
export default defineEventHandler(async (event) => {
  // No defineRouteMeta - BAD!
  const body = await readValidatedBody(event, createTokenSchema.parse)
  return await createToken(body)
})
```

**Correct (with route metadata):**

```typescript
// ✅ CORRECT - server/api/tokens.post.ts
import { createTokenSchema } from '#shared/schemas/token'

export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Tokens'],
      summary: 'Create a new API token',
      description: 'Creates a new API token for the authenticated user with specified scopes and optional expiration.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Token name' },
                scopes: { type: 'array', items: { type: 'string' } },
                expiresAt: { type: 'string', format: 'date-time', nullable: true }
              },
              required: ['name', 'scopes']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Token created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiToken'
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  })

  const body = await readValidatedBody(event, createTokenSchema.parse)
  return await createToken(body)
})
```

**Minimal metadata (at minimum):**

```typescript
// ✅ At minimum, include tags and summary
export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Returns the authenticated user\'s profile information'
    }
  })

  return await getCurrentUser(event)
})
```

**Common patterns:**

```typescript
// GET endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'List all items',
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer' } },
      { name: 'limit', in: 'query', schema: { type: 'integer' } }
    ]
  }
})

// DELETE endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'Delete an item',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
    ],
    responses: {
      '204': { description: 'Item deleted' },
      '404': { description: 'Item not found' }
    }
  }
})

// Protected endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    summary: 'Admin-only operation',
    security: [{ bearerAuth: [] }]
  }
})
```

**Enable OpenAPI in nuxt.config:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
```

**Access generated docs:**

- OpenAPI JSON: `/_nitro/openapi.json`
- Swagger UI: `/_nitro/swagger`

Reference: [Nitro Route Meta](https://nitro.unjs.io/guide/routing#route-meta)

---

### Use useRuntimeConfig, Never process.env

**Impact:** HIGH - Ensures type safety and consistent configuration access

## Use useRuntimeConfig, Never process.env

In Nuxt, `runtimeConfig` is the SINGLE SOURCE OF TRUTH for configuration. Never use `process.env` directly in application code.

**Incorrect (direct process.env):**

```typescript
// ❌ WRONG - nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,  // NO!
        clientSecret: process.env.GOOGLE_CLIENT_SECRET  // NO!
      }
    }
  }
})

// ❌ WRONG - server/utils/auth.ts
if (process.env.GOOGLE_CLIENT_ID) {  // NO!
  // ...
}

// ❌ WRONG - anywhere in server code
const apiKey = process.env.STRIPE_SECRET_KEY  // NO!
```

**Correct (useRuntimeConfig):**

```typescript
// ✅ CORRECT - nuxt.config.ts
// Define structure with empty defaults - Nuxt auto-maps from env vars
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (server only) - maps from NUXT_*
    oauth: {
      google: {
        clientId: '',      // ← NUXT_OAUTH_GOOGLE_CLIENT_ID
        clientSecret: ''   // ← NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    },
    stripe: {
      secretKey: ''        // ← NUXT_STRIPE_SECRET_KEY
    },
    // Public keys (exposed to client)
    public: {
      baseUrl: '',         // ← NUXT_PUBLIC_BASE_URL
      apiVersion: 'v1'
    }
  }
})
```

```typescript
// ✅ CORRECT - server/utils/auth.ts
const config = useRuntimeConfig()

if (config.oauth.google.clientId) {
  // Fully typed configuration access
}

// ✅ CORRECT - server/api/payment.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripe.secretKey)
  // ...
})
```

**Environment variable naming convention:**

| runtimeConfig Path | Environment Variable |
|-------------------|---------------------|
| `runtimeConfig.oauth.google.clientId` | `NUXT_OAUTH_GOOGLE_CLIENT_ID` |
| `runtimeConfig.stripe.secretKey` | `NUXT_STRIPE_SECRET_KEY` |
| `runtimeConfig.database.url` | `NUXT_DATABASE_URL` |
| `runtimeConfig.public.baseUrl` | `NUXT_PUBLIC_BASE_URL` |

**Client-side access (public only):**

```vue
<script setup>
// Client can only access public config
const config = useRuntimeConfig()
const apiUrl = config.public.baseUrl
</script>
```

**Type augmentation:**

```typescript
// nuxt.config.ts or types/nuxt.d.ts
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    oauth: {
      google: {
        clientId: string
        clientSecret: string
      }
    }
    stripe: {
      secretKey: string
    }
  }
  interface PublicRuntimeConfig {
    baseUrl: string
    apiVersion: string
  }
}
```

**Why not process.env?**

| Feature | process.env | useRuntimeConfig |
|---------|------------|------------------|
| Type safety | ❌ | ✅ |
| Consistent access | ❌ | ✅ |
| Auto env mapping | ❌ | ✅ |
| Client/server split | ❌ | ✅ |
| Default values | Manual | Built-in |

Reference: [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)

---

### Use getValidatedQuery/readValidatedBody with Zod

**Impact:** HIGH - Ensures type safety and proper error handling for API inputs

## Use getValidatedQuery/readValidatedBody with Zod

Always use Nuxt's validated versions with Zod schemas for type-safe request handling. Never use raw `getQuery` or `readBody`.

**Incorrect (no validation):**

```typescript
// ❌ WRONG - server/api/users.get.ts
export default defineEventHandler(async (event) => {
  // No validation, type is unknown
  const query = getQuery(event)
  
  // Could be anything! No type safety
  const page = query.page  // unknown
  const limit = query.limit  // unknown
  
  return await getUsers(page, limit)
})

// ❌ WRONG - server/api/users.post.ts
export default defineEventHandler(async (event) => {
  // No validation, could throw at runtime
  const body = await readBody(event)
  
  // No guarantee these fields exist
  return await createUser(body.name, body.email)
})
```

**Correct (validated with Zod):**

```typescript
// shared/schemas/user.ts
import { z } from 'zod'

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user')
})

export type UserQuery = z.infer<typeof userQuerySchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
```

```typescript
// ✅ CORRECT - server/api/users.get.ts
import { userQuerySchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  // Validates and returns typed object
  // Throws 400 automatically on invalid input
  const query = await getValidatedQuery(event, userQuerySchema.parse)
  
  // query is fully typed: { page: number, limit: number, search?: string, status?: 'active' | 'inactive' }
  return await getUsers(query)
})

// ✅ CORRECT - server/api/users.post.ts
import { createUserSchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  // Validates body against schema
  const body = await readValidatedBody(event, createUserSchema.parse)
  
  // body is typed: { name: string, email: string, role: 'user' | 'admin' }
  return await createUser(body)
})
```

**Using safeParse for custom error handling:**

```typescript
import { createUserSchema } from '#shared/schemas/user'

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event)
  const result = createUserSchema.safeParse(rawBody)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: {
        errors: result.error.flatten().fieldErrors
      }
    })
  }
  
  return await createUser(result.data)
})
```

**Route parameters validation:**

```typescript
// server/api/users/[id].get.ts
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  return await getUser(id)
})
```

**Benefits:**

| Feature | Raw | Validated |
|---------|-----|-----------|
| Type safety | ❌ | ✅ |
| Automatic 400 errors | ❌ | ✅ |
| Input coercion | ❌ | ✅ |
| Default values | ❌ | ✅ |
| Schema reusability | ❌ | ✅ |

Reference: [Nitro Validation](https://nitro.unjs.io/guide/utils#validation)

---

### Use useState for SSR-Safe Shared State

**Impact:** MEDIUM-HIGH - Prevents hydration mismatches and state leakage between requests

## Use useState for SSR-Safe Shared State

In Nuxt, `useState` is SSR-safe and handles hydration correctly. Using plain `ref()` for shared state causes hydration mismatches and state leakage between server requests.

**Incorrect (plain ref for shared state):**

```typescript
// ❌ WRONG - composables/useCounter.ts
// This state is shared across ALL requests on the server!
const count = ref(0)

export function useCounter() {
  function increment() {
    count.value++
  }
  return { count, increment }
}
```

```typescript
// ❌ WRONG - State in module scope
// shared-state.ts
export const globalUser = ref<User | null>(null)  // Leaks between requests!
```

**Correct (useState for shared state):**

```typescript
// ✅ CORRECT - composables/useCounter.ts
export function useCounter() {
  // useState creates request-scoped state on server
  // and hydrates correctly on client
  const count = useState<number>('counter', () => 0)
  
  function increment() {
    count.value++
  }
  
  return { count, increment }
}
```

```typescript
// ✅ CORRECT - Shared user state
export function useUser() {
  const user = useState<User | null>('user', () => null)
  
  async function fetchUser() {
    const { data } = await useFetch('/api/me')
    user.value = data.value
  }
  
  return { user, fetchUser }
}
```

**useState vs ref:**

| Scenario | Use | Why |
|----------|-----|-----|
| Component-local state | `ref()` | Scoped to component instance |
| Shared state (cross-component) | `useState()` | SSR-safe, request-scoped |
| Composable internal state | `ref()` if not shared | Tied to composable call |
| Global app state | `useState()` | Prevents server state leakage |

**Named state with unique keys:**

```typescript
export function useCart() {
  // Key must be unique across the app
  const items = useState<CartItem[]>('cart-items', () => [])
  const total = computed(() => 
    items.value.reduce((sum, item) => sum + item.price, 0)
  )
  
  return { items, total }
}

export function useTheme() {
  // Different key for different state
  const theme = useState<'light' | 'dark'>('app-theme', () => 'light')
  
  return { theme }
}
```

**Clearing state:**

```typescript
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  
  async function logout() {
    await $fetch('/api/logout', { method: 'POST' })
    user.value = null
    // Or clear all state
    clearNuxtState('auth-user')
  }
  
  return { user, logout }
}
```

**With Pinia (recommended for complex state):**

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // Pinia handles SSR automatically in Nuxt
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  
  async function login(credentials: Credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
  }
  
  return { user, isLoggedIn, login }
})
```

Reference: [Nuxt State Management](https://nuxt.com/docs/getting-started/state-management)

---

### Use Correct Import Paths (#shared, ~/, ~~/)

**Impact:** MEDIUM - Ensures imports resolve correctly across client and server

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

---

### Never Use `any` Type

**Impact:** MEDIUM - Maintains type safety throughout the codebase

## Never Use `any` Type

Using `any` defeats the purpose of TypeScript. It propagates through your codebase and causes runtime errors that types should prevent.

**Incorrect (using any):**

```typescript
// ❌ WRONG - Explicit any
const data: any = response

// ❌ WRONG - Function with any
function process(input: any): any {
  return input.something.nested // No type checking!
}

// ❌ WRONG - any in generics
const items: Array<any> = []

// ❌ WRONG - Type assertion to any
const user = response as any
```

**Correct (proper typing):**

```typescript
// ✅ CORRECT - Define proper types
import type { ApiResponse, User } from '#shared/types/api'

const data: ApiResponse<User> = response

// ✅ CORRECT - Typed function
function process(input: ProcessInput): ProcessOutput {
  return transformData(input)
}

// ✅ CORRECT - Typed arrays
const items: User[] = []

// ✅ CORRECT - Proper type assertion
const user = response as User
```

**When type is truly unknown, use `unknown`:**

```typescript
// ✅ CORRECT - Use unknown for truly unknown data
function parseJson(json: string): unknown {
  return JSON.parse(json)
}

// Then narrow with type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

const parsed = parseJson(jsonString)
if (isUser(parsed)) {
  // parsed is now typed as User
  console.log(parsed.email)
}
```

**Using Zod for runtime validation:**

```typescript
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})

type User = z.infer<typeof userSchema>

// Parse unknown data with validation
const user = userSchema.parse(unknownData)
// user is now typed as User
```

**For external library types:**

```typescript
// ❌ WRONG
const result: any = externalLib.doSomething()

// ✅ CORRECT - Create type declaration
declare module 'external-lib' {
  interface Result {
    data: string
    status: number
  }
  function doSomething(): Result
}

// Or use type assertion with defined type
interface ExpectedResult {
  data: string
  status: number
}
const result = externalLib.doSomething() as ExpectedResult
```

**Event handlers:**

```typescript
// ❌ WRONG
const handleClick = (e: any) => { ... }

// ✅ CORRECT
const handleClick = (e: MouseEvent) => { ... }
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}
```

**ESLint rules to enforce:**

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error"
  }
}
```

Reference: [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

### Use kebab-case Emits with Full Type Definitions

**Impact:** MEDIUM - Ensures consistent event naming and type safety

## Use kebab-case Emits with Full Type Definitions

All Vue component emits MUST use kebab-case consistently across `defineEmits`, `emit()` calls, and template event handlers.

**Incorrect (camelCase emits):**

```vue
<script setup lang="ts">
// ❌ WRONG - camelCase in defineEmits
const emit = defineEmits<{
  manageSubscription: []  // NO! Use kebab-case
  toggleVisibility: [id: string, visible: boolean]  // NO!
  updateValue: [value: number]  // NO!
}>()

// Inconsistent emit calls
emit('manageSubscription')
emit('toggleVisibility', id, true)
</script>
```

**Correct (kebab-case everywhere):**

```vue
<script setup lang="ts">
// ✅ CORRECT - kebab-case with quotes in defineEmits
const emit = defineEmits<{
  'manage-subscription': []
  'toggle-visibility': [id: string, visible: boolean]
  'update-value': [value: number]
}>()

// Consistent emit calls
emit('manage-subscription')
emit('toggle-visibility', id, true)
emit('update-value', 42)
</script>
```

**Parent component usage:**

```vue
<template>
  <!-- kebab-case in template event handlers -->
  <ChildComponent
    @manage-subscription="handleManageSubscription"
    @toggle-visibility="handleToggleVisibility"
    @update-value="handleUpdateValue"
  />
</template>

<script setup lang="ts">
function handleManageSubscription() {
  // ...
}

function handleToggleVisibility(id: string, visible: boolean) {
  // ...
}

function handleUpdateValue(value: number) {
  // ...
}
</script>
```

**With v-model:**

```vue
<!-- Child component -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

// v-model emits use 'update:modelValue' pattern
const emit = defineEmits<{
  'update:model-value': [value: string]  // kebab-case
}>()

function updateValue(newValue: string) {
  emit('update:model-value', newValue)
}
</script>

<!-- Parent usage -->
<template>
  <MyInput v-model="text" />
  <!-- Or explicitly -->
  <MyInput :model-value="text" @update:model-value="text = $event" />
</template>
```

**Named function handlers (avoid inline arrows):**

```vue
<!-- ❌ WRONG - Inline arrow with multiple params -->
<template>
  <LayerTree
    @toggle-visibility="(layerId, visible) => emit('toggle-layer-visibility', layerId, visible)"
  />
</template>

<!-- ✅ CORRECT - Named function -->
<script setup>
function handleToggleVisibility(layerId: string, visible: boolean) {
  emit('toggle-layer-visibility', layerId, visible)
}
</script>

<template>
  <LayerTree @toggle-visibility="handleToggleVisibility" />
</template>
```

**The pattern summary:**

| Location | Format | Example |
|----------|--------|---------|
| `defineEmits` type | `'kebab-case'` (quoted) | `'manage-subscription': []` |
| `emit()` call | `'kebab-case'` | `emit('manage-subscription')` |
| Template `@event` | `@kebab-case` | `@manage-subscription="handler"` |

**Why kebab-case?**

1. Consistency with HTML attribute conventions
2. Makes event names grep-able across templates and scripts
3. Avoids confusion between JS camelCase and HTML kebab-case
4. Matches Vue's official style guide

Reference: [Vue Style Guide - Events](https://vuejs.org/style-guide/rules-strongly-recommended.html#component-event-casing)
