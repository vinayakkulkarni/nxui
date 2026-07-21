---
title: Use useLayout to Read the Resolved Layout (Nuxt 4.5+)
impact: MEDIUM
impactDescription: Replaces brittle route.meta.layout reads that miss route-rule layouts
tags: pages, layouts, useLayout, composables, nuxt-4.5
---

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
