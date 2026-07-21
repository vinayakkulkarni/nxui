---
title: Cache Component State with KeepAlive
impact: HIGH
impactDescription: Preserves state, avoids expensive re-initialization
tags: component, keep-alive, caching, state-preservation
---

## Cache Component State with KeepAlive

Use `<KeepAlive>` to cache component instances when switching between them, preserving their state and avoiding expensive re-mounting.

**Incorrect (state lost on switch):**

```vue
<template>
  <div>
    <button @click="currentTab = 'search'">Search</button>
    <button @click="currentTab = 'results'">Results</button>

    <!-- Component destroyed and recreated on each switch -->
    <SearchForm v-if="currentTab === 'search'" />
    <ResultsTable v-if="currentTab === 'results'" />
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const currentTab = ref('search');
  // User's search input is lost when switching tabs!
</script>
```

**Correct (state preserved with KeepAlive):**

```vue
<template>
  <div>
    <button @click="currentTab = 'search'">Search</button>
    <button @click="currentTab = 'results'">Results</button>

    <!-- Components cached, state preserved -->
    <KeepAlive>
      <component :is="currentTabComponent" />
    </KeepAlive>
  </div>
</template>

<script setup>
  import { ref, computed, shallowRef } from 'vue';
  import SearchForm from './SearchForm.vue';
  import ResultsTable from './ResultsTable.vue';

  const currentTab = ref('search');

  const tabs = {
    search: SearchForm,
    results: ResultsTable,
  };

  const currentTabComponent = computed(() => tabs[currentTab.value]);
</script>
```

**Include/exclude specific components:**

```vue
<template>
  <!-- Only cache these components -->
  <KeepAlive include="SearchForm,ResultsTable">
    <component :is="currentView" />
  </KeepAlive>

  <!-- Cache all except these -->
  <KeepAlive exclude="HeavyComponent">
    <component :is="currentView" />
  </KeepAlive>

  <!-- Using regex -->
  <KeepAlive :include="/Form$/">
    <component :is="currentView" />
  </KeepAlive>
</template>
```

**`include`/`exclude` match against the component `name`:**

Matching is performed against each component's `name` option — not the tag or file path. Since 3.2.34, a `<script setup>` SFC automatically infers its `name` from the **filename**, so `SearchForm.vue` matches `"SearchForm"` without any extra config. Only set `name` manually (via a separate `<script>` block or `defineOptions({ name: '...' })`) when the desired match name differs from the filename.

**Limit cached instances:**

```vue
<template>
  <!-- Only keep last 5 components in cache -->
  <KeepAlive :max="5">
    <component :is="currentView" />
  </KeepAlive>
</template>
```

**Lifecycle hooks for cached components:**

```vue
<script setup>
  import { onActivated, onDeactivated } from 'vue';

  // Called on initial mount AND every time it is re-inserted from the cache
  onActivated(() => {
    console.log('Component activated from cache');
    // Refresh data if needed
    fetchLatestData();
  });

  // Called when removed from the DOM into the cache AND on unmount
  onDeactivated(() => {
    console.log('Component deactivated to cache');
    // Cleanup if needed
    pauseVideoPlayback();
  });
</script>
```

**With Vue Router:**

```vue
<!-- App.vue -->
<template>
  <router-view v-slot="{ Component }">
    <KeepAlive :include="['SearchView', 'DashboardView']">
      <component :is="Component" />
    </KeepAlive>
  </router-view>
</template>
```

**When to use KeepAlive:**

| Scenario                                         | Use KeepAlive?          |
| ------------------------------------------------ | ----------------------- |
| Tab-based navigation with forms                  | Yes                     |
| Wizard/stepper with user input                   | Yes                     |
| Dashboard with expensive charts                  | Yes                     |
| List → Detail → Back to list                     | Yes                     |
| Simple static content pages                      | No                      |
| Components with real-time data that must refresh | Maybe (use onActivated) |

Reference: [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html)
