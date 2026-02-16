---
title: Use useFetch/useAsyncData, Never Raw fetch in Components
impact: CRITICAL
impactDescription: Prevents hydration errors and enables SSR caching
tags: data-fetching, useFetch, useAsyncData, ssr, hydration
---

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
