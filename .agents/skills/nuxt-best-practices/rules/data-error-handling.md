---
title: Always Handle Error and Pending States
impact: HIGH
impactDescription: Prevents blank screens and improves UX
tags: data-fetching, error-handling, loading-states, ux
---

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
