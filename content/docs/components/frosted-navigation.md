---
title: Frosted Navigation
description: Bottom navigation where content melts into a progressive frosted-glass gradient — stacked backdrop blurs, a serif search pill, and spring-animated tabs.
---

::demo-frosted-navigation
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/frosted-navigation.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import FrostedNavigation from '~/components/ui/frosted-navigation/FrostedNavigation.vue';

  const active = ref('everything');
  const query = ref('');

  const tabs = [
    { id: 'everything', label: 'Everything', icon: 'lucide:layout-grid' },
    { id: 'spaces', label: 'Spaces', icon: 'lucide:circle' },
    { id: 'serendipity', label: 'Serendipity', icon: 'lucide:sparkles' },
  ];
</script>

<template>
  <div class="relative h-150 overflow-hidden">
    <div class="h-full overflow-y-auto">
      <!-- scrolling content -->
    </div>
    <FrostedNavigation
      v-model="active"
      v-model:query="query"
      :tabs="tabs"
      accent="#f43f16"
      :frost-height="220"
    />
  </div>
</template>
```

The frost is six stacked `backdrop-blur` strips with staggered gradient
masks (1px → 28px), so scrolling content dissolves progressively instead
of hitting a hard blur edge — the effect from mymind's mobile app. On top
sit a serif italic search pill (`v-model:query`, `submit` event) and a
spring-animated tab bar (`v-model` active id). Position it absolutely
inside any relative scroll container.

## Props

| Prop            | Type                     | Default               | Description                 |
| --------------- | ------------------------ | --------------------- | --------------------------- |
| `v-model`       | `string`                 | —                     | Active tab id               |
| `v-model:query` | `string`                 | `''`                  | Search input value          |
| `tabs`          | `FrostedNavigationTab[]` | —                     | Tab definitions             |
| `placeholder`   | `string`                 | `'Search my mind...'` | Search pill placeholder     |
| `accent`        | `string`                 | `'#f43f16'`           | Active tab color            |
| `frost-height`  | `number`                 | `220`                 | Frost zone height in pixels |

### FrostedNavigationTab

| Field   | Type     | Description                          |
| ------- | -------- | ------------------------------------ |
| `id`    | `string` | Unique tab id                        |
| `label` | `string` | Tab label                            |
| `icon`  | `string` | Iconify name, e.g. `lucide:sparkles` |

## Events

| Event    | Payload  | Description                   |
| -------- | -------- | ----------------------------- |
| `submit` | `string` | Search pill submitted (Enter) |

## Credits

Frosted navigation concept from [mymind](https://mymind.com), shared by
[@vanschneider](https://x.com/vanschneider/status/2074817942286418325).
