---
title: Transform Data at Fetch Time, Not in Template
impact: HIGH
impactDescription: Reduces payload size and avoids repeated transformations
tags: data-fetching, transform, pick, performance
---

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
