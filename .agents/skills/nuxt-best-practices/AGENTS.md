# Nuxt Best Practices - Complete Reference

> This file is auto-generated. Do not edit directly.
> Edit individual rule files in the `rules/` directory and run `pnpm build`.

# Nuxt Best Practices

Comprehensive performance optimization guide for Nuxt 4 applications (current: Nuxt 4.5, with notes for 3.x apps approaching EOL). Contains 23 rules across 9 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new Nuxt pages, components, or composables
- Implementing data fetching (useFetch, useAsyncData, the 4.5 `enabled` option)
- Creating server routes and API endpoints
- Organizing types, composables, and auto-imports
- Working with Nuxt modules and plugins
- Configuring rendering modes (SSR, SSG, SPA, 4.5 experimental SSR streaming)
- Using layouts, named views, and NuxtLink prefetching (Nuxt 4.5 conventions)

## Rule Categories by Priority

| Priority | Category                    | Impact      | Prefix       |
| -------- | --------------------------- | ----------- | ------------ |
| 1        | Data Fetching               | CRITICAL    | `data-`      |
| 2        | Auto-Imports & Organization | CRITICAL    | `imports-`   |
| 3        | Server & API Routes         | HIGH        | `server-`    |
| 4        | Rendering Modes             | HIGH        | `rendering-` |
| 5        | State Management            | MEDIUM-HIGH | `state-`     |
| 6        | Pages, Layouts & Navigation | MEDIUM      | `pages-`     |
| 7        | Type Safety                 | MEDIUM      | `types-`     |
| 8        | Modules & Plugins           | LOW-MEDIUM  | `modules-`   |
| 9        | Performance & Deployment    | LOW         | `perf-`      |

## Quick Reference

### 1. Data Fetching (CRITICAL)

- `data-use-fetch` - Use useFetch/useAsyncData, never raw fetch in components
- `data-key-unique` - Always provide unique keys for data fetching
- `data-lazy-loading` - Use lazy option for non-critical data
- `data-transform` - Transform data at fetch time, not in template
- `data-error-handling` - Always handle error and pending states
- `data-refresh-patterns` - Use refresh() and clear() appropriately
- `data-conditional-enabled` - Use the `enabled` option for conditional fetching (4.5+)

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
- `rendering-ssr-streaming` - Understand SSR streaming before enabling it (4.5+, experimental)

### 5. State Management (MEDIUM-HIGH)

- `state-use-state` - Use useState for SSR-safe shared state
- `state-pinia-setup` - Set up Pinia correctly with Nuxt
- `state-hydration` - Handle hydration mismatches properly
- `state-computed-over-watch` - Prefer computed over watch for derived state

### 6. Pages, Layouts & Navigation (MEDIUM)

- `pages-use-layout` - Use useLayout to read the resolved layout (4.5+)
- `pages-named-views` - Use the name@view.vue convention for named views (4.5+)
- `pages-nuxtlink-custom-prefetch` - Wire prefetch manually in NuxtLink custom slots (4.5+)

### 7. Type Safety (MEDIUM)

- `types-no-inline` - Never define types inline in components/composables
- `types-import-paths` - Use correct import paths (#shared, ~/, ~~/)
- `types-no-any` - Never use `any` type
- `types-zod-schemas` - Use Zod for runtime validation with type inference
- `types-strict-emits` - Type emits fully; declare camelCase, listen kebab-case

### 8. Modules & Plugins (LOW-MEDIUM)

- `modules-order` - Module order matters in nuxt.config
- `modules-runtime-vs-build` - Understand runtime vs build-time modules
- `plugins-client-server` - Use .client.ts and .server.ts suffixes correctly
- `plugins-provide-inject` - Use provide/inject for cross-cutting concerns

### 9. Performance & Deployment (LOW)

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

### Use the enabled Option for Conditional Data Fetching (Nuxt 4.5+)

**Impact:** HIGH - Replaces fragile immediate/watch workarounds and prevents wasted requests

## Use the `enabled` Option for Conditional Data Fetching (Nuxt 4.5+)

Nuxt 4.5 added a reactive `enabled` option to `useFetch` and `useAsyncData`. While `enabled` evaluates to `false`, every execution path is blocked — the initial fetch, `execute()`/`refresh()` calls, and `watch` triggers. Flipping it from `true` to `false` mid-flight cancels the in-flight request without clearing existing `data`.

Before 4.5, conditional fetching required hand-rolled combinations of `immediate: false`, external watchers, and guard clauses. Don't write those anymore.

**Incorrect (hand-rolled precondition guards):**

```vue
<script setup lang="ts">
  const query = ref('');

  // BAD: immediate: false + manual watch + guard — fragile and verbose
  const { data, execute } = await useFetch('/api/search', {
    query: { q: query },
    immediate: false,
  });

  watch(query, (value) => {
    // Guard duplicated everywhere execute() is called
    if (value.length > 2) {
      execute();
    }
  });
</script>
```

**Correct (reactive `enabled` gate):**

```vue
<script setup lang="ts">
  const query = ref('');

  // GOOD: one reactive barrier — no watcher, no guards
  const { data } = await useFetch('/api/search', {
    query: { q: query },
    // Only fetch once the user has typed something
    enabled: () => query.value.length > 2,
  });
</script>
```

**Dependent (chained) queries:**

```vue
<script setup lang="ts">
  // Second request depends on the first one resolving
  const { data: user } = await useFetch('/api/me');

  const { data: orders } = await useFetch(
    () => `/api/users/${user.value?.id}/orders`,
    {
      // Blocks until the user is loaded
      enabled: () => !!user.value?.id,
    },
  );
</script>
```

**Accepted values** — `enabled` is `MaybeRefOrGetter<boolean>`:

```ts
enabled: true; // static
enabled: someBooleanRef; // ref
enabled: computed(() => cond); // computed
enabled: () => cond; // getter
```

**Exact semantics:**

| Behavior               | What happens                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `enabled` is `false`   | Initial fetch, `execute()`, `refresh()`, and watch triggers blocked |
| Flips `true` → `false` | In-flight request cancelled; existing `data` retained               |
| Data on disable        | **Kept** — not cleared (call `clear()` yourself if needed)          |
| Flips `false` → `true` | Does NOT auto-refetch — a trigger (watch/execute) must fire         |

**`enabled` vs `immediate` — they solve different problems:**

| Requirement                                             | Use                              |
| ------------------------------------------------------- | -------------------------------- |
| Block all execution until a reactive condition is met   | `enabled`                        |
| Skip only the initial auto-fetch, fetch later on demand | `immediate: false` + `execute()` |
| Fetch on explicit user action (button click)            | `immediate: false` + `execute()` |
| Cancel in-flight work when a condition becomes false    | reactive `enabled`               |

`immediate: false` is not deprecated — it remains the right tool for user-triggered fetching. `enabled` supersedes the awkward `immediate: false` + external-watch pattern only when the gate is a reactive precondition.

**Note:** Cancellation works because `$fetch` honors the injected `AbortSignal`. If you pass a custom handler to `useAsyncData`, accept and forward the signal: `(_ctx, { signal }) => $fetch(url, { signal })`.

Reference: [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) | [useFetch](https://nuxt.com/docs/api/composables/use-fetch) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)

---

### Always Handle Error and Pending States

**Impact:** HIGH - Prevents blank screens and improves UX

## Always Handle Error and Pending States

Data fetching can fail or take time. Always handle `error` and `status`/`pending` states to provide good user experience.

**Incorrect (no error/loading handling):**

```vue
<script setup>
  // BAD: No handling of errors or loading states
  const { data: users } = await useFetch('/api/users');
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
  const {
    data: users,
    status,
    error,
    refresh,
  } = await useFetch('/api/users', {
    default: () => [],
  });
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

| Status    | Description                    |
| --------- | ------------------------------ |
| `idle`    | No request made yet            |
| `pending` | Request in progress            |
| `success` | Request completed successfully |
| `error`   | Request failed                 |

`pending` is still a supported boolean ref (equal to `status === 'pending'`) — not deprecated — but prefer `status` for the full lifecycle.

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
  const { data: stats, status } = useLazyFetch('/api/stats');
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
  options?: UseFetchOptions<T>,
) {
  const toast = useToast();

  const result = useFetch(url, {
    ...options,
    onResponseError: ({ response }) => {
      toast.error(response._data?.message || 'Request failed');
      options?.onResponseError?.({ response });
    },
  });

  return result;
}
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling) | [useFetch](https://nuxt.com/docs/api/composables/use-fetch)

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
  const page = ref(1);
  const { data } = await useFetch('/api/items', {
    key: `items-page-${page.value}`,
    query: { page },
  });

  // Detail page
  const route = useRoute();
  const { data } = await useFetch(`/api/items/${route.params.id}`, {
    key: `item-${route.params.id}`,
  });

  // Filtered data
  const filters = reactive({ status: 'active', category: 'tech' });
  const { data } = await useFetch('/api/items', {
    key: computed(() => `items-${JSON.stringify(filters)}`),
    query: filters,
  });
</script>
```

**Watch for reactive key changes:**

```vue
<script setup>
  const selectedId = ref('123');

  // Automatically refetches when key changes
  const { data } = await useFetch(() => `/api/items/${selectedId.value}`);

  // Or use watch option with explicit key
  const { data } = await useFetch('/api/items', {
    key: () => `item-${selectedId.value}`,
    query: { id: selectedId },
    watch: [selectedId],
  });
</script>
```

**Avoid dynamic keys in loops:**

```vue
<script setup>
  // BAD: Creates many parallel requests
  const items = ref(['a', 'b', 'c']);
  // Don't do this in a loop!
  for (const id of items.value) {
    await useFetch(`/api/items/${id}`); // Anti-pattern
  }

  // GOOD: Fetch all at once
  const { data } = await useFetch('/api/items', {
    query: { ids: items.value.join(',') },
  });
</script>
```

**How auto-generated keys work (clarified in the Nuxt 4.5 docs):**

`useFetch` derives its auto key from the URL, the fetch options, AND the source call-site location (behavior present throughout Nuxt 4.x; the docs spelled it out explicitly in 4.5). Two components calling the same URL get **different** auto keys and do NOT share state:

```vue
<script setup>
  // ComponentA.vue and ComponentB.vue both call:
  const { data } = await useFetch('/api/settings');
  // Different call sites → different auto keys → two cache entries

  // GOOD: To share state across components, use the same explicit key
  const { data } = await useFetch('/api/settings', { key: 'app-settings' });
</script>
```

The same applies to `useAsyncData`: the generated key is unique to the call location, so always pass an explicit key when wrapping it in a custom composable.

Reference: [Nuxt Data Fetching - Keys](https://nuxt.com/docs/getting-started/data-fetching#keys)

---

### Transform Data at Fetch Time, Not in Template

**Impact:** HIGH - Reduces payload size and avoids repeated transformations

## Transform Data at Fetch Time, Not in Template

Transform and filter data in useFetch options rather than in templates or computed properties. This reduces the payload sent to the client and avoids repeated transformations.

`transform`/`pick` shrink the client payload only — the full response is still fetched on the server. To reduce what's fetched, change the API itself.

**Incorrect (transform in template/computed):**

```vue
<script setup>
  // BAD: Full response sent to client, transformed on every render
  const { data: response } = await useFetch('/api/users');

  // Computed runs on every access
  const users = computed(
    () =>
      response.value?.data?.users?.map((u) => ({
        id: u.id,
        displayName: `${u.firstName} ${u.lastName}`,
        avatar: u.profile?.avatar || '/default.png',
      })) ?? [],
  );
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
    pick: ['id', 'name', 'email'],
  });

  // For nested picking with transform
  const { data: user } = await useFetch(`/api/users/${id}`, {
    transform: (response) => ({
      id: response.id,
      name: response.name,
      // Exclude sensitive/large fields like password, fullProfile, etc.
    }),
  });
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
        message: response._data?.message || 'Unknown error',
      });
    },
  });
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
  import { ref, onMounted } from 'vue';

  const users = ref([]);
  const loading = ref(true);

  // BAD: Raw fetch causes hydration mismatch and duplicate requests
  onMounted(async () => {
    const response = await fetch('/api/users');
    users.value = await response.json();
    loading.value = false;
  });
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
  const { data: users, status, error } = await useFetch('/api/users');
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
    const settings = await loadSettings();
    const features = await getFeatureFlags();
    return { settings, features };
  });
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
    key: `users-${page.value}`,
  });
</script>
```

**Lazy loading for non-critical data:**

```vue
<script setup>
  // useLazyFetch doesn't block navigation
  const { data: recommendations, status } = useLazyFetch(
    '/api/recommendations',
  );

  // Or with lazy option
  const { data: stats } = await useFetch('/api/stats', { lazy: true });
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

| Path                        | Component Usage           | Notes          |
| --------------------------- | ------------------------- | -------------- |
| `Button.vue`                | `<Button />`              | Root level     |
| `ui/Button.vue`             | `<UiButton />`            | Folder prefix  |
| `ui/form/Input.vue`         | `<UiFormInput />`         | Nested folders |
| `dashboard/cards/Stats.vue` | `<DashboardCardsStats />` | Deep nesting   |

**Note:** Nuxt automatically removes a filename segment that exactly matches its folder (`tokens/Tokens.vue` → `<Tokens>`), but does NOT dedupe partial overlaps like `Tokens` vs `Token` — hence `tokens/TokenCard.vue` → `<TokensTokenCard>`.

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
  components: [
    {
      path: '~/components/ui',
      pathPrefix: false, // No folder-derived prefix for UI components
    },
  ],
});
```

`pathPrefix: false` removes the folder-derived prefix; `prefix: 'X'` adds one.

Reference: [Nuxt Components Directory](https://nuxt.com/docs/guide/directory-structure/app/components)

---

### Composables Export Functions Only, Not Types

**Impact:** HIGH - Prevents type pollution and maintains clean architecture

## Composables Export Functions Only, Not Types

Composable files should ONLY export functions. Import types from dedicated type files. This is a project convention — Nuxt does not enforce it — but keeping composables function-only keeps the architecture clean.

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
import {
  useOAuthProviders,
  type OAuthProviderId,
} from '~/composables/auth/use-oauth';
```

**Correct (types in dedicated files):**

```typescript
// ✅ CORRECT - shared/types/auth.ts
export type OAuthProviderId = 'google' | 'github' | 'discord';

export interface OAuthProviderInfo {
  id: OAuthProviderId;
  name: string;
  icon: string;
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
import type { OAuthProviderId } from '#shared/types/auth';
// useOAuthProviders is auto-imported
const { providers } = useOAuthProviders();
```

**Benefits of separation:**

```typescript
// Types can be imported without function overhead
import type { User, Session } from '#shared/types/auth';

// Composables are auto-imported in components
const { user, login, logout } = useAuth();

// Server code can import types without client composable code
// server/api/auth.ts
import type { User } from '#shared/types/auth';
```

**Return types for composables:**

```typescript
// Define return type interface in types file
// app/types/auth.ts
import type { Ref, ComputedRef } from 'vue';
import type { User } from '#shared/types/auth';

export interface UseAuthReturn {
  user: Ref<User | null>;
  isAuthenticated: ComputedRef<boolean>;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}
```

```typescript
// Composable uses the return type
// app/composables/auth/use-auth.ts
import type { UseAuthReturn } from '~/types/auth';

export function useAuth(): UseAuthReturn {
  // Implementation
}
```

**What composables CAN export:**

| Export Type             | OK? | Notes                           |
| ----------------------- | --- | ------------------------------- |
| Functions (composables) | ✅  | Primary export                  |
| Constants               | ⚠️  | Move to separate constants file |
| Types/Interfaces        | ❌  | Move to types directory         |
| Classes                 | ❌  | Move to utils or services       |

**Note:** `shared/types/` is an auto-import location — top-level files there are scanned automatically (v3.14+), so explicit `#shared/types/...` imports are optional for top-level files and required for nested ones.

Reference: [Nuxt Composables](https://nuxt.com/docs/guide/directory-structure/composables)

---

### Use Direct Imports Between Composables

**Impact:** HIGH - Prevents circular dependency warnings at build time

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

---

### Understand Barrel Export Rules for Auto-Imported Directories

**Impact:** CRITICAL - Prevents duplicate import warnings and enables proper auto-imports

## Understand Barrel Export Rules for Auto-Imported Directories

Nuxt auto-imports from specific directories. The rules for barrel exports (`index.ts`) differ by directory type.

**How Nuxt auto-imports work:**

| Directory       | Scan Behavior  | Barrel Needed?         |
| --------------- | -------------- | ---------------------- |
| `composables/`  | Top-level only | Yes, for nested        |
| `utils/`        | Top-level only | Yes, for nested        |
| `server/utils/` | Recursive      | No (causes duplicates) |
| `components/`   | Recursive      | No                     |

**Incorrect (barrel in recursively-scanned directory):**

```typescript
// ❌ WRONG - server/utils/admin/index.ts
// server/utils/ is scanned RECURSIVELY - barrel causes duplicates!
export { getAIUsageMetrics } from './ai-usage';
export { getUserAnalytics } from './user-analytics';
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
export { useAuth, useSession } from './auth/use-auth';
export { useTokens } from './tokens/use-tokens';
export { useBilling } from './billing/use-billing';
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
// The problem arises specifically from double re-export: this feature
// barrel is then re-exported by the root composables/index.ts, creating
// a cycle and duplicate imports — not from the feature barrel existing alone.
export * from './use-auth';
export * from './use-session';

// ✅ CORRECT - Export directly from root composables/index.ts instead
```

**Summary:**

| Location                    | Barrel Export? | Reason                                                                                                  |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `composables/index.ts`      | ✅ Yes         | Enables nested auto-imports                                                                             |
| `composables/auth/index.ts` | ❌ No          | Causes duplicates/circular deps                                                                         |
| `server/utils/**`           | ❌ No          | Recursive scan - duplicates                                                                             |
| `utils/index.ts`            | ✅ Yes         | Enables nested auto-imports                                                                             |
| `shared/types/index.ts`     | ✅ Yes         | top-level files in `shared/types/` ARE auto-imported (v3.14+); nested subdirs are not unless configured |

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
export type OAuthProviderId = 'google' | 'github';
```

**Correct (dedicated type directories):**

```
project/
├── app/
│   └── types/                    # Frontend-only UI types
│       ├── auth.ts               # OAuthProviderUIConfig, LoginFormState
│       ├── billing.ts            # TierInfo, ButtonConfig
│       └── navigation.ts         # SidebarState, NavItem
├── shared/                       # available since Nuxt 3.14+
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
import type { OAuthProviderUIConfig } from '~/types/auth';
import type { TierInfo } from '~/types/billing';

// Shared types (from shared/types/)
import type { User, Session } from '#shared/types/auth';
import type { ApiToken } from '#shared/types/token';

// Server types (from server/types/)
import type { InternalConfig } from '~~/server/types/internal';
```

**Type location decision table:**

| Type Category        | Location        | Import Path           | Examples                            |
| -------------------- | --------------- | --------------------- | ----------------------------------- |
| UI component props   | `app/types/`    | `~/types/...`         | Form state, display config          |
| API request/response | `shared/types/` | `#shared/types/...`   | User, ApiToken, responses           |
| Database entities    | `shared/types/` | `#shared/types/...`   | DB models used by both              |
| Server internals     | `server/types/` | `~~/server/types/...` | Middleware context, internal config |

**Note:** `shared/types/` top-level files are auto-imported (v3.14+); `app/types/` and `server/types/` are plain import targets (no auto-import).

**Why this matters:**

1. **Clarity**: Know where to find and add types
2. **Sharing**: Shared types work on both client and server
3. **Bundle size**: Server types aren't bundled to client
4. **Maintainability**: Types are organized by domain, not scattered

Reference: [Nuxt TypeScript](https://nuxt.com/docs/guide/concepts/typescript)

---

### Use the name@view.vue Convention for Named Views (Nuxt 4.5+)

**Impact:** MEDIUM - File-based multi-outlet routing without manual router configuration

## Use the `name@view.vue` Convention for Named Views (Nuxt 4.5+)

Nuxt 4.5 wired Vue Router's named views into file-based routing. When a parent page renders more than one `<NuxtPage>` outlet, give each extra outlet a name and provide a sibling page file using the `name@view.vue` filename convention.

**Incorrect (manual router config or prop-drilling to fake a second outlet):**

```vue
<!-- BAD: passing "sidebar content" down as props/slots because
     file-based routing "only supports one outlet" — it doesn't anymore -->
<template>
  <div>
    <NuxtPage :sidebar-content="sidebarForCurrentRoute" />
  </div>
</template>
```

**Correct (named views via filename convention):**

```
# Directory structure
-| pages/
---| parent/
-----| child.vue          → default outlet
-----| child@sidebar.vue  → "sidebar" outlet
---| parent.vue
```

```vue
<!-- pages/parent.vue -->
<template>
  <div>
    <NuxtPage />
    <aside>
      <NuxtPage name="sidebar" />
    </aside>
  </div>
</template>
```

Navigating to `/parent/child` renders `child.vue` into the default outlet and `child@sidebar.vue` into the `sidebar` outlet. An outlet with no matching named-view file stays empty.

**Limitations (from the official docs):**

| Limitation               | Detail                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `definePageMeta`         | Read from the **default** route file only — ignored in `@view` files |
| Per-view rendering modes | Not supported — the parent page's mode applies to the default view   |

**When to use:** persistent secondary panels that change per-route — sidebars, inspector panes, master-detail layouts. For content that doesn't change per-route, a plain component in the layout is simpler.

Reference: [Pages — Named Views](https://nuxt.com/docs/guide/directory-structure/app/pages#named-views)

---

### Wire Prefetch Manually in NuxtLink Custom Slots (Nuxt 4.5+)

**Impact:** MEDIUM - Custom-slot links silently lose prefetching unless wired via the new slot props

## Wire Prefetch Manually in NuxtLink Custom Slots (Nuxt 4.5+)

`<NuxtLink custom>` has never attached prefetch handlers automatically — Nuxt can't know how you structured your markup. As of 4.5, the slot exposes `prefetch`, `prefetched`, and `shouldPrefetch` so you can wire prefetching yourself. If you migrate a link to `custom` and skip this, the link silently loses prefetching.

**Incorrect (custom slot with no prefetch wiring):**

```vue
<template>
  <!-- BAD: renders fine, but never prefetches — perceived nav gets slower -->
  <NuxtLink v-slot="{ href, navigate }" to="/about" custom>
    <a :href="href" @click="navigate">About page</a>
  </NuxtLink>
</template>
```

**Correct (wire the new slot props):**

```vue
<template>
  <NuxtLink
    v-slot="{ href, navigate, prefetch, prefetched, shouldPrefetch }"
    to="/about"
    custom
  >
    <a
      :href="href"
      :class="{ 'is-prefetched': prefetched }"
      @click="navigate"
      @pointerenter="shouldPrefetch('interaction') && prefetch()"
      @focus="shouldPrefetch('interaction') && prefetch()"
    >
      About page
    </a>
  </NuxtLink>
</template>
```

**The three slot props:**

| Prop                      | Purpose                                                                   |
| ------------------------- | ------------------------------------------------------------------------- |
| `prefetch()`              | Triggers prefetching of the destination                                   |
| `prefetched`              | `true` once the destination is prefetched (drive a CSS class from it)     |
| `shouldPrefetch(trigger)` | Respects the user's connection + link config before you call `prefetch()` |

**What `custom` opts you out of** — none of these apply automatically anymore:

- Prefetch handlers (`prefetchOn` behavior)
- `prefetchedClass`

**When NOT to use `custom`:** if you don't need to restructure the markup, a plain `<NuxtLink>` keeps automatic prefetching. Reach for `custom` only when wrapping the link in a component library primitive or non-`<a>` markup.

Reference: [NuxtLink](https://nuxt.com/docs/api/components/nuxt-link) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)

---

### Use useLayout to Read the Resolved Layout (Nuxt 4.5+)

**Impact:** MEDIUM - Replaces brittle route.meta.layout reads that miss route-rule layouts

## Use `useLayout` to Read the Resolved Layout (Nuxt 4.5+)

Nuxt 4.5 added the `useLayout` composable — a read-only computed ref of the layout resolved for the current route. Before it, reading `route.meta.layout` was the common workaround, which misses layouts set via route rules and defaults.

**Incorrect (reading route meta directly):**

```vue
<script setup lang="ts">
  // BAD: misses layouts set via routeRules (appLayout) and
  // resolves to undefined when the page relies on the default
  const route = useRoute();
  const layout = computed(() => route.meta.layout ?? 'default');
</script>
```

**Correct (useLayout):**

```vue
<!-- app.vue -->
<script setup lang="ts">
  // GOOD: reflects the full resolution chain, stays reactive across navigation
  const layout = useLayout();
</script>

<template>
  <div>
    <CommandPalette v-if="layout !== 'minimal'" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

**Resolution order** (first match wins):

1. Page `layout` metadata (`definePageMeta({ layout: ... })`)
2. `appLayout` from matching route rules
3. `'default'`

**Note:** when called inside a rendered `<NuxtLayout>`, `useLayout` instead reflects that enclosing layout.

**Key facts:**

| Fact                  | Detail                                                         |
| --------------------- | -------------------------------------------------------------- |
| Return type           | `Readonly<ComputedRef<LayoutName>>` — a string, or `false`     |
| Can return `false`    | When the layout is disabled — handle it, don't assume a string |
| Script access         | Use `layout.value`; templates auto-unwrap                      |
| Inside `<NuxtLayout>` | Reflects that enclosing layout                                 |
| Outside (app.vue)     | Returns the layout resolved for the current route              |

Reference: [useLayout](https://nuxt.com/docs/api/composables/use-layout)

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
  const width = ref(window.innerWidth);

  // localStorage doesn't exist on server!
  const saved = localStorage.getItem('settings');
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

**Note:** The default slot's content is tree-shaken out of the server build — CSS used by components inside it may not be inlined in the initial HTML, causing a flash of unstyled content (FOUC). Render a `#fallback` that reserves the same layout to minimise this.

**Fallback via props (attribute alternative to the `#fallback` slot):**

```vue
<template>
  <!-- fallback / fallback-tag render placeholder text until the client mounts -->
  <ClientOnly fallback="Loading chart..." fallback-tag="span">
    <ChartComponent :data="data" />
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
<script setup lang="ts">
  // Safe to use browser APIs here
  const canvas = ref<HTMLCanvasElement>();

  onMounted(() => {
    const ctx = canvas.value?.getContext('2d');
    // Initialize chart...
  });
</script>
```

**Safe browser API access:**

```vue
<script setup lang="ts">
  // ✅ CORRECT - Check for client before using browser APIs
  const width = ref(0);
  const savedSettings = ref<Settings | null>(null);

  onMounted(() => {
    // This only runs on client
    width.value = window.innerWidth;
    savedSettings.value = JSON.parse(localStorage.getItem('settings') || '{}');
  });

  // Or use import.meta.client
  if (import.meta.client) {
    // Browser-only code
  }
</script>
```

**Using VueUse for SSR-safe utilities:**

```vue
<script setup>
  import { useWindowSize, useLocalStorage, useMediaQuery } from '@vueuse/core';

  // These are SSR-safe!
  const { width, height } = useWindowSize();
  const settings = useLocalStorage('settings', { theme: 'light' });
  const isMobile = useMediaQuery('(max-width: 768px)');
</script>
```

**Common browser-only scenarios:**

| Scenario                    | Solution                              |
| --------------------------- | ------------------------------------- |
| Charts (Chart.js, ECharts)  | `<ClientOnly>` or `.client.vue`       |
| Maps (MapLibre, Leaflet)    | `<ClientOnly>` or `.client.vue`       |
| Rich text editors           | `<ClientOnly>`                        |
| Canvas/WebGL                | `<ClientOnly>` or `onMounted`         |
| localStorage/sessionStorage | `useLocalStorage` from VueUse         |
| window.matchMedia           | `useMediaQuery` from VueUse           |
| IntersectionObserver        | `useIntersectionObserver` from VueUse |

**Lazy loading client-only components:**

```vue
<script setup>
  // Lazy load heavy client-only component
  const HeavyChart = defineAsyncComponent(
    () => import('~/components/HeavyChart.client.vue'),
  );
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

### Understand SSR Streaming Before Enabling It (Nuxt 4.5+, Experimental)

**Impact:** MEDIUM - Dramatically improves TTFB but silently drops late response mutations

## Understand SSR Streaming Before Enabling It (Nuxt 4.5+, Experimental)

Nuxt 4.5 added experimental SSR streaming. Instead of buffering the fully rendered page, Nuxt flushes the HTML shell (`<head>`, styles, preload hints, entry scripts) immediately and streams the body as Vue renders it — dramatically improving Time to First Byte on content-heavy routes.

The critical constraint: **the first streamed byte commits the HTTP status and headers**. Anything that mutates the response after rendering has begun cannot reach the client.

**Enabling it:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    // Boolean form
    ssrStreaming: true,

    // Or object form with a custom crawler matcher
    // ssrStreaming: {
    //   botRegex: /googlebot|bingbot|my-internal-crawler/i,
    // },
  },

  routeRules: {
    // Opt individual routes out of streaming
    '/no-stream/**': { streaming: false },
  },
});
```

**Incorrect (response mutation during rendering — silently dropped):**

```vue
<script setup lang="ts">
  // BAD with streaming enabled: by the time this runs, the shell may
  // already be flushed — the 404 status never reaches the client
  const { data: post } = await useFetch(`/api/posts/${route.params.slug}`);

  if (!post.value) {
    setResponseStatus(useRequestEvent()!, 404); // DROPPED mid-stream
  }

  // BAD: cookie writes during render are also dropped
  const visited = useCookie('visited');
  visited.value = 'true'; // DROPPED mid-stream
</script>
```

**Correct (mutate before rendering, or opt the route out):**

```typescript
// GOOD: Nuxt plugins and Nitro plugins run before rendering starts —
// response mutations there always reach the client
export default defineNuxtPlugin(() => {
  const event = useRequestEvent();
  // Safe: runs before the shell is flushed
});
```

```typescript
// GOOD: routes that must set status/cookies late stay buffered
export default defineNuxtConfig({
  experimental: { ssrStreaming: true },
  routeRules: {
    '/account/**': { streaming: false }, // sets cookies during render
  },
});
```

**Automatic buffered fallback** — these are never streamed (no action needed):

| Condition                                      | Why                                     |
| ---------------------------------------------- | --------------------------------------- |
| Route rules: `redirect`, `cache`, `isr`, `swr` | Response must be complete before commit |
| Route rules: `noScripts`, `ssr: false`         | Incompatible render paths               |
| Bot/crawler user agents (per `botRegex`)       | Search engines get fully-rendered HTML  |
| Prerendered routes                             | Already static                          |
| Server-side `navigateTo()` redirects           | Status must change                      |

**Error behavior:** errors thrown after the shell is flushed cannot change the HTTP status — Nuxt completes a well-formed document and hydration renders the error page. Monitoring that relies on 5xx status codes won't see mid-stream failures.

**When to enable:**

- Content-heavy routes where TTFB matters (blogs, docs, marketing)
- Apps whose response mutations all happen in plugins/middleware before render

**When to keep it off (or opt routes out):**

- Routes that set cookies, headers, or status codes inside `<script setup>` after an `await`
- Until you've tested: development logs a warning naming any dropped mutation — watch for those before shipping

Reference: [SSR Streaming — Experimental Features](https://nuxt.com/docs/guide/going-further/experimental-features#ssrstreaming) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)

---

### Use createError for Consistent Error Responses

**Impact:** HIGH - Ensures consistent error format across all API endpoints

## Use createError for Consistent Error Responses

Use Nuxt's `createError` utility for all API errors. It provides consistent error format, proper HTTP status codes, and integrates with Nuxt's error handling.

**Note:** `statusCode`/`statusMessage` are legacy h3 aliases and still work, but current Nuxt docs use `status`/`statusText`.

**Load-bearing behavior:** A `message` passed to `createError` in an API route does NOT propagate to the client. Use `statusText` for the short client-visible text and the `data` property for structured payloads — with `useFetch`, custom data is available at `error.value.data.data`.

**`statusText` must be short HTTP-compliant text (printable ASCII);** longer detail belongs in `message` (server-side only) or `data`.

**Security:** avoid putting dynamic user input into error messages/`statusText` — move any such detail into `data`.

**Incorrect (throwing raw errors):**

```typescript
// ❌ WRONG - Inconsistent error handling
export default defineEventHandler(async (event) => {
  const user = await getUser(event);

  if (!user) {
    throw new Error('User not found'); // Generic 500 error
  }

  // Or worse
  return { error: 'Not found', status: 404 }; // Inconsistent format
});
```

**Correct (using createError):**

```typescript
// ✅ CORRECT - server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const user = await getUser(id);

  if (!user) {
    // Don't interpolate user input into statusText — put it in data
    throw createError({
      status: 404,
      statusText: 'Not Found',
      data: { resource: 'user', id },
    });
  }

  return user;
});
```

**Common error patterns:**

```typescript
// 400 Bad Request - Invalid input
throw createError({
  status: 400,
  statusText: 'Bad Request',
  data: {
    field: 'email',
    reason: 'Must be a valid email address',
  },
});

// 401 Unauthorized - Not authenticated
throw createError({
  status: 401,
  statusText: 'Unauthorized',
});

// 403 Forbidden - Not authorized
throw createError({
  status: 403,
  statusText: 'Forbidden',
});

// 404 Not Found
throw createError({
  status: 404,
  statusText: 'Not Found',
});

// 409 Conflict - Duplicate
throw createError({
  status: 409,
  statusText: 'Conflict',
  data: { reason: 'Email already registered' },
});

// 422 Unprocessable Entity - Validation
throw createError({
  status: 422,
  statusText: 'Unprocessable Entity',
  data: {
    errors: validationErrors,
  },
});

// 500 Internal Server Error
throw createError({
  status: 500,
  statusText: 'Internal Server Error',
});
```

**Error response helper:**

```typescript
// server/utils/errors.ts
export function notFound(resource: string, id?: string) {
  // id is user input — keep it out of statusText, put it in data
  throw createError({
    status: 404,
    statusText: 'Not Found',
    data: { resource, id },
  });
}

export function unauthorized(statusText = 'Unauthorized') {
  throw createError({
    status: 401,
    statusText,
  });
}

export function forbidden(statusText = 'Forbidden') {
  throw createError({
    status: 403,
    statusText,
  });
}

export function badRequest(statusText: string, data?: unknown) {
  throw createError({
    status: 400,
    statusText,
    data,
  });
}
```

```typescript
// Usage in handlers
export default defineEventHandler(async (event) => {
  const user = await getUser(id);
  if (!user) notFound('User', id);

  if (!canAccess(user)) forbidden();

  return user;
});
```

**Client-side error handling:**

```vue
<script setup>
  const { data, error } = await useFetch('/api/users/123');

  if (error.value) {
    // error.value has shape: { status, statusText, data }
    // The server `message` does NOT reach the client — read statusText/data.
    console.error(error.value.statusText);

    // Structured payload from createError({ data }) lands at error.value.data.data
    const details = error.value.data?.data;
    // e.g. { resource: 'user', id: '123' }
  }
</script>
```

Reference: [Nuxt Error Handling](https://nuxt.com/docs/getting-started/error-handling)

---

### Always Add defineRouteMeta for OpenAPI Documentation

**Impact:** HIGH - Enables automatic API documentation generation

## Always Add defineRouteMeta for OpenAPI Documentation

Adding `defineRouteMeta` for OpenAPI documentation is recommended as a project convention on every API endpoint. It enables automatic API docs generation and helps consumers understand your API. Note that Nitro's OpenAPI generation is experimental and the metadata itself is optional.

`defineRouteMeta` is a **build-time macro** that Nitro statically extracts during the build — it has no runtime presence in your handler. Because of this, it MUST be called at the **module top level** of the route file (sibling to `export default defineEventHandler(...)`), **not** inside the `defineEventHandler` callback. Putting it inside the callback places a build-time macro inside runtime request code, which is incorrect and may not be statically extracted.

**Incorrect (missing route metadata):**

```typescript
// ❌ WRONG - server/api/tokens.post.ts
export default defineEventHandler(async (event) => {
  // No defineRouteMeta - BAD!
  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Incorrect (defineRouteMeta placed inside the handler callback):**

```typescript
// ❌ WRONG - build-time macro inside runtime request handler
export default defineEventHandler(async (event) => {
  defineRouteMeta({
    openAPI: {
      tags: ['Tokens'],
      summary: 'Create a new API token',
    },
  });

  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Correct (defineRouteMeta at module top level, sibling to the exported handler):**

```typescript
// ✅ CORRECT - server/api/tokens.post.ts
import { createTokenSchema } from '#shared/schemas/token';

defineRouteMeta({
  openAPI: {
    tags: ['Tokens'],
    summary: 'Create a new API token',
    description:
      'Creates a new API token for the authenticated user with specified scopes and optional expiration.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Token name' },
              scopes: { type: 'array', items: { type: 'string' } },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
            },
            required: ['name', 'scopes'],
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Token created successfully',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiToken',
            },
          },
        },
      },
      '400': { description: 'Invalid input' },
      '401': { description: 'Unauthorized' },
    },
  },
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createTokenSchema.parse);
  return await createToken(body);
});
```

**Minimal metadata (at minimum):**

```typescript
// ✅ At minimum, include tags and summary
defineRouteMeta({
  openAPI: {
    tags: ['Users'],
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile information",
  },
});

export default defineEventHandler(async (event) => {
  return await getCurrentUser(event);
});
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
      { name: 'limit', in: 'query', schema: { type: 'integer' } },
    ],
  },
});

export default defineEventHandler(async (event) => {
  return await listItems(event);
});

// DELETE endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Items'],
    summary: 'Delete an item',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: {
      '204': { description: 'Item deleted' },
      '404': { description: 'Item not found' },
    },
  },
});

export default defineEventHandler(async (event) => {
  return await deleteItem(event);
});

// Protected endpoint
defineRouteMeta({
  openAPI: {
    tags: ['Admin'],
    summary: 'Admin-only operation',
    security: [{ bearerAuth: [] }],
  },
});

export default defineEventHandler(async (event) => {
  return await adminOperation(event);
});
```

**Enable OpenAPI in nuxt.config:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true,
    },
    // OpenAPI generation is experimental; endpoints are dev-only by default.
    // Enable them in production explicitly:
    openAPI: {
      production: 'runtime', // or 'prerender'
    },
  },
});
```

**Access generated docs:**

- OpenAPI JSON: `/_openapi.json`
- Swagger UI: `/_swagger`
- Scalar UI: `/_scalar`

Reference: [Nitro Route Meta](https://nitro.unjs.io/guide/routing#route-meta) | [Nitro OpenAPI - Route Metadata](https://nitro.build/docs/openapi#route-metadata)

---

### Use useRuntimeConfig, Never process.env

**Impact:** HIGH - Ensures type safety and consistent configuration access

## Use useRuntimeConfig, Never process.env

In Nuxt, `runtimeConfig` is the SINGLE SOURCE OF TRUTH for configuration. Never use `process.env` directly in application code.

**Serialization caveat:** runtime config is serialized — it must not contain functions, Sets, Maps, or other non-serializable values.

**Security:** never expose private (non-`public`) runtime config to the client — don't render it in the template or pass it to `useState`.

**Incorrect (direct process.env):**

```typescript
// ❌ WRONG - nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    oauth: {
      google: {
        // A default referencing a DIFFERENTLY-named env var (GOOGLE_* here,
        // not NUXT_OAUTH_GOOGLE_*) is read only at BUILD time and is baked in.
        // At runtime Nuxt only overrides from the matching NUXT_-prefixed var,
        // so this value CANNOT be changed at runtime and breaks in production.
        clientId: process.env.GOOGLE_CLIENT_ID, // NO!
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // NO!
      },
    },
  },
});

// ❌ WRONG - server/utils/auth.ts
if (process.env.GOOGLE_CLIENT_ID) {
  // NO!
  // ...
}

// ❌ WRONG - anywhere in server code
const apiKey = process.env.STRIPE_SECRET_KEY; // NO!
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
        clientId: '', // ← NUXT_OAUTH_GOOGLE_CLIENT_ID
        clientSecret: '', // ← NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      },
    },
    stripe: {
      secretKey: '', // ← NUXT_STRIPE_SECRET_KEY
    },
    // Public keys (exposed to client)
    public: {
      baseUrl: '', // ← NUXT_PUBLIC_BASE_URL
      apiVersion: 'v1',
    },
  },
});
```

```typescript
// ✅ CORRECT - server/api/payment.ts
// Pass the event so per-request runtime env overrides apply (docs-recommended).
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const stripe = new Stripe(config.stripe.secretKey);
  // ...
});
```

**Environment variable naming convention:**

| runtimeConfig Path                    | Environment Variable          |
| ------------------------------------- | ----------------------------- |
| `runtimeConfig.oauth.google.clientId` | `NUXT_OAUTH_GOOGLE_CLIENT_ID` |
| `runtimeConfig.stripe.secretKey`      | `NUXT_STRIPE_SECRET_KEY`      |
| `runtimeConfig.database.url`          | `NUXT_DATABASE_URL`           |
| `runtimeConfig.public.baseUrl`        | `NUXT_PUBLIC_BASE_URL`        |

**Client-side access (public only):**

```vue
<script setup>
  // Client can only access public config
  const config = useRuntimeConfig();
  const apiUrl = config.public.baseUrl;
</script>
```

**Type augmentation:**

```typescript
// nuxt.config.ts or types/nuxt.d.ts
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    oauth: {
      google: {
        clientId: string;
        clientSecret: string;
      };
    };
    stripe: {
      secretKey: string;
    };
  }
  interface PublicRuntimeConfig {
    baseUrl: string;
    apiVersion: string;
  }
}
```

**Why not process.env?**

| Feature             | process.env | useRuntimeConfig |
| ------------------- | ----------- | ---------------- |
| Type safety         | ❌          | ✅               |
| Consistent access   | ❌          | ✅               |
| Auto env mapping    | ❌          | ✅               |
| Client/server split | ❌          | ✅               |
| Default values      | Manual      | Built-in         |

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
  const query = getQuery(event);

  // Could be anything! No type safety
  const page = query.page; // unknown
  const limit = query.limit; // unknown

  return await getUsers(page, limit);
});

// ❌ WRONG - server/api/users.post.ts
export default defineEventHandler(async (event) => {
  // No validation, could throw at runtime
  const body = await readBody(event);

  // No guarantee these fields exist
  return await createUser(body.name, body.email);
});
```

**Correct (validated with Zod):**

```typescript
// shared/schemas/user.ts
import { z } from 'zod';

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

export type UserQuery = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

```typescript
// ✅ CORRECT - server/api/users.get.ts
import { userQuerySchema } from '#shared/schemas/user';

export default defineEventHandler(async (event) => {
  // Pass the Zod schema object directly (h3 v2 Standard-Schema support).
  // Validates and returns typed object; throws 400 automatically on invalid input.
  const query = await getValidatedQuery(event, userQuerySchema);

  // query is fully typed: { page: number, limit: number, search?: string, status?: 'active' | 'inactive' }
  return await getUsers(query);
});

// ✅ CORRECT - server/api/users.post.ts
import { createUserSchema } from '#shared/schemas/user';

export default defineEventHandler(async (event) => {
  // Validates body against schema
  const body = await readValidatedBody(event, createUserSchema);

  // body is typed: { name: string, email: string, role: 'user' | 'admin' }
  return await createUser(body);
});
```

**Note:** Passing `schema.parse` also works — any validation function is accepted.

**Using safeParse for custom error handling:**

```typescript
import { createUserSchema } from '#shared/schemas/user';

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event);
  const result = createUserSchema.safeParse(rawBody);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: {
        errors: result.error.flatten().fieldErrors,
      },
    });
  }

  return await createUser(result.data);
});
```

**Route parameters validation:**

```typescript
// server/api/users/[id].get.ts
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, paramsSchema);
  return await getUser(id);
});
```

**Benefits:**

| Feature              | Raw | Validated |
| -------------------- | --- | --------- |
| Type safety          | ❌  | ✅        |
| Automatic 400 errors | ❌  | ✅        |
| Input coercion       | ❌  | ✅        |
| Default values       | ❌  | ✅        |
| Schema reusability   | ❌  | ✅        |

Reference: [h3 Request Utils](https://h3.dev/utils/request)

---

### Use useState for SSR-Safe Shared State

**Impact:** MEDIUM-HIGH - Prevents hydration mismatches and state leakage between requests

## Use useState for SSR-Safe Shared State

In Nuxt, `useState` is SSR-safe and handles hydration correctly. Using plain `ref()` for shared state causes hydration mismatches and state leakage between server requests.

**Serialization constraint:** `useState` data is serialized to JSON to transfer it from server to client — it must be a plain object/array/primitive. It must NOT contain classes, functions, or symbols, or you'll hit a `Cannot stringify arbitrary non-POJOs` error.

**Reserved name:** `useState` is a reserved, compiler-transformed name — don't name your own functions `useState`.

**Incorrect (plain ref for shared state):**

```typescript
// ❌ WRONG - composables/useCounter.ts
// This state is shared across ALL requests on the server!
const count = ref(0);

export function useCounter() {
  function increment() {
    count.value++;
  }
  return { count, increment };
}
```

```typescript
// ❌ WRONG - State in module scope
// shared-state.ts
export const globalUser = ref<User | null>(null); // Leaks between requests!
```

**Correct (useState for shared state):**

```typescript
// ✅ CORRECT - composables/useCounter.ts
export function useCounter() {
  // useState creates request-scoped state on server
  // and hydrates correctly on client
  const count = useState<number>('counter', () => 0);

  function increment() {
    count.value++;
  }

  return { count, increment };
}
```

```typescript
// ✅ CORRECT - Shared user state
export function useUser() {
  const user = useState<User | null>('user', () => null);

  async function fetchUser() {
    // useFetch belongs in setup context only — use $fetch in imperative methods
    const data = await $fetch('/api/me');
    user.value = data;
  }

  return { user, fetchUser };
}
```

**useState vs ref:**

| Scenario                       | Use                   | Why                           |
| ------------------------------ | --------------------- | ----------------------------- |
| Component-local state          | `ref()`               | Scoped to component instance  |
| Shared state (cross-component) | `useState()`          | SSR-safe, request-scoped      |
| Composable internal state      | `ref()` if not shared | Tied to composable call       |
| Global app state               | `useState()`          | Prevents server state leakage |

**Named state with unique keys:**

```typescript
export function useCart() {
  // Key must be unique across the app
  const items = useState<CartItem[]>('cart-items', () => []);
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price, 0),
  );

  return { items, total };
}

export function useTheme() {
  // Different key for different state
  const theme = useState<'light' | 'dark'>('app-theme', () => 'light');

  return { theme };
}
```

**Clearing state:**

```typescript
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null);

  async function logout() {
    await $fetch('/api/logout', { method: 'POST' });
    user.value = null;
    // Or clear all state
    clearNuxtState('auth-user');
  }

  return { user, logout };
}
```

**With Pinia (recommended for complex state):**

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // Pinia handles SSR automatically in Nuxt
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => !!user.value);

  async function login(credentials: Credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials,
    });
  }

  return { user, isLoggedIn, login };
});
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
import type { User } from '../../../shared/types/auth';
import type { ApiToken } from '../../shared/types/token';

// ❌ WRONG - Using ~/shared instead of #shared
import type { User } from '~/shared/types/auth';

// ❌ WRONG - Accessing server types from client
// In a Vue component:
import type { InternalConfig } from '~/server/types/internal';
```

**Correct (proper aliases):**

```typescript
// ✅ CORRECT - Shared types (client & server)
import type { User, Session } from '#shared/types/auth';
import type { ApiToken, TokenMetadata } from '#shared/types/token';

// ✅ CORRECT - Frontend/app types
import type { TierInfo } from '~/types/billing';
import type { NavItem } from '~/types/navigation';

// ✅ CORRECT - Server types (only in server code)
import type { InternalConfig } from '~~/server/types/internal';

// ✅ CORRECT - Shared schemas
import { createUserSchema } from '#shared/schemas/user';

// ✅ CORRECT - Shared utilities
import { formatDate } from '#shared/utils/date';
```

**Import alias reference:**

| Alias      | Resolves To  | Use In          | Example              |
| ---------- | ------------ | --------------- | -------------------- |
| `#shared`  | `shared/`    | Client & Server | `#shared/types/auth` |
| `~/`       | `app/`       | Client code     | `~/types/billing`    |
| `~~/`      | Project root | Server code     | `~~/server/types/`   |
| `#imports` | Auto-imports | Anywhere        | `#imports`           |

**No manual configuration needed:** `#shared` is configured automatically by Nuxt for the root `shared/` directory (v3.14+) — no manual alias or `extends` config required.

**Note:** only top-level `shared/utils/` and `shared/types/` files are auto-imported; everything else in `shared/` needs an explicit `#shared/...` import.

**Type-only imports:**

```typescript
// Always use 'import type' for types
import type { User } from '#shared/types/auth'; // ✅ Correct
import { User } from '#shared/types/auth'; // ⚠️ Works but less explicit

// For mixed imports
import { userSchema, type User } from '#shared/schemas/user';
```

**Avoid inline import():**

```typescript
// ❌ WRONG - Inline import in type annotation
export interface ApiErrorData {
  errorCode?: import('~/types/embed').EmbedErrorCode; // NO!
}

// ✅ CORRECT - Top-level import type
import type { EmbedErrorCode } from '~/types/embed';

export interface ApiErrorData {
  errorCode?: EmbedErrorCode;
}
```

**Server-only imports:**

```typescript
// server/api/users.get.ts

// ✅ These work in server context
import { useDrizzle } from '~~/server/utils/db';
import type { DatabaseUser } from '~~/server/types/database';

// ✅ Shared types work everywhere
import type { User } from '#shared/types/auth';

// ❌ Don't import app/ in server code
import { useAuth } from '~/composables/auth'; // NO!
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
const data: any = response;

// ❌ WRONG - Function with any
function process(input: any): any {
  return input.something.nested; // No type checking!
}

// ❌ WRONG - any in generics
const items: Array<any> = [];

// ❌ WRONG - Type assertion to any
const user = response as any;
```

**Correct (proper typing):**

```typescript
// ✅ CORRECT - Define proper types
import type { ApiResponse, User } from '#shared/types/api';

const data: ApiResponse<User> = response;

// ✅ CORRECT - Typed function
function process(input: ProcessInput): ProcessOutput {
  return transformData(input);
}

// ✅ CORRECT - Typed arrays
const items: User[] = [];

// ✅ CORRECT - Proper type assertion
const user = response as User;
```

**When type is truly unknown, use `unknown`:**

```typescript
// ✅ CORRECT - Use unknown for truly unknown data
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

// Then narrow with type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

const parsed = parseJson(jsonString);
if (isUser(parsed)) {
  // parsed is now typed as User
  console.log(parsed.email);
}
```

**Using Zod for runtime validation:**

```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

type User = z.infer<typeof userSchema>;

// Parse unknown data with validation
const user = userSchema.parse(unknownData);
// user is now typed as User
```

**For external library types:**

```typescript
// ❌ WRONG
const result: any = externalLib.doSomething();

// ✅ CORRECT - Create type declaration
declare module 'external-lib' {
  interface Result {
    data: string;
    status: number;
  }
  function doSomething(): Result;
}

// Or use type assertion with defined type
interface ExpectedResult {
  data: string;
  status: number;
}
const result = externalLib.doSomething() as ExpectedResult;
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

### Type Emits Fully with camelCase Declarations

**Impact:** MEDIUM - Ensures consistent event naming and type safety

## Type Emits Fully with camelCase Declarations

Declare and emit events in camelCase; listen in kebab-case in templates. Vue's automatic case transformation bridges the two, so this is the documented convention — NOT kebab-case declarations. Always type emits fully with the 3.3+ named-tuple syntax; never use untyped emits.

**Incorrect (kebab-case declarations / untyped emits):**

```vue
<script setup lang="ts">
  // ❌ WRONG - kebab-case in defineEmits contradicts Vue's convention
  const emit = defineEmits<{
    'manage-subscription': [];
    'update-value': [value: number];
  }>();

  // ❌ WRONG - untyped emits (no payload types)
  const emit = defineEmits(['manageSubscription', 'updateValue']);
</script>
```

**Correct (camelCase declarations, 3.3+ named-tuple syntax):**

```vue
<script setup lang="ts">
  // ✅ CORRECT - declare emits in camelCase with typed payloads
  const emit = defineEmits<{
    change: [id: number];
    updateValue: [value: string];
  }>();

  // Emit in camelCase
  emit('change', 1);
  emit('updateValue', 'hello');
</script>
```

**Parent component usage (listen in kebab-case):**

```vue
<template>
  <!-- Listen in kebab-case — Vue transforms camelCase ↔ kebab-case automatically -->
  <ChildComponent @change="handleChange" @update-value="handleUpdateValue" />
</template>

<script setup lang="ts">
  function handleChange(id: number) {
    // ...
  }

  function handleUpdateValue(value: string) {
    // ...
  }
</script>
```

**With v-model — the event MUST be `update:modelValue` (camelCase):**

`v-model` requires the event name `update:modelValue` matching the `modelValue` prop. `'update:model-value'` (kebab-case) breaks `v-model`.

```vue
<!-- Child component -->
<script setup lang="ts">
  const props = defineProps<{
    modelValue: string;
  }>();

  // ✅ CORRECT - camelCase 'update:modelValue' matches the modelValue prop
  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  function updateValue(newValue: string) {
    emit('update:modelValue', newValue);
  }
</script>

<!-- Parent usage -->
<template>
  <MyInput v-model="text" />
  <!-- Or explicitly -->
  <MyInput :model-value="text" @update:model-value="text = $event" />
</template>
```

**Preferred (Vue 3.4+): use `defineModel()` for v-model bindings:**

`defineModel()` is the modern macro for v-model — it wires the `modelValue` prop and `update:modelValue` event for you.

```vue
<!-- Child component -->
<script setup lang="ts">
  // Two-way binding — no manual prop + emit needed
  const model = defineModel<string>();

  function updateValue(newValue: string) {
    model.value = newValue;
  }
</script>
```

**Named function handlers (avoid inline arrows):**

```vue
<!-- ❌ WRONG - Inline arrow with multiple params -->
<template>
  <LayerTree
    @toggle-visibility="
      (layerId, visible) => emit('toggleLayerVisibility', layerId, visible)
    "
  />
</template>

<!-- ✅ CORRECT - Named function -->
<script setup lang="ts">
  const emit = defineEmits<{
    toggleLayerVisibility: [layerId: string, visible: boolean];
  }>();

  function handleToggleVisibility(layerId: string, visible: boolean) {
    emit('toggleLayerVisibility', layerId, visible);
  }
</script>

<template>
  <LayerTree @toggle-visibility="handleToggleVisibility" />
</template>
```

**The pattern summary:**

| Location           | Format                          | Example                        |
| ------------------ | ------------------------------- | ------------------------------ |
| `defineEmits` type | camelCase, typed named-tuple    | `updateValue: [value: string]` |
| `emit()` call      | camelCase                       | `emit('updateValue', v)`       |
| Template `@event`  | kebab-case (auto-transformed)   | `@update-value="handler"`      |
| v-model event      | `update:modelValue` (camelCase) | `emit('update:modelValue', v)` |

**Why this convention?**

1. Matches Vue's documented case-transformation behavior (declare/emit camelCase, listen kebab-case)
2. `update:modelValue` must stay camelCase or `v-model` breaks
3. Full payload typing catches wrong-argument bugs at compile time
4. `defineModel()` removes the manual prop+emit boilerplate for two-way bindings

Reference: [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) | [Component Events](https://vuejs.org/guide/components/events.html)
