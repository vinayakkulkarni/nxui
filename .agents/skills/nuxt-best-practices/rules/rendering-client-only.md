---
title: Use ClientOnly for Browser-Specific Components
impact: HIGH
impactDescription: Prevents SSR errors and hydration mismatches
tags: rendering, client-only, ssr, hydration, browser-api
---

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
