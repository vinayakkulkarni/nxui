---
title: Always Provide Unique Keys for Data Fetching
impact: CRITICAL
impactDescription: Prevents cache collisions and stale data
tags: data-fetching, keys, caching, useFetch, useAsyncData
---

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
