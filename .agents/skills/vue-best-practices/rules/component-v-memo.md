---
title: Use v-memo for Expensive List Items
impact: MEDIUM
impactDescription: Rarely-needed micro-optimization for very large lists (1000+ items)
tags: component, v-memo, lists, performance, memoization
---

## Use v-memo for Expensive List Items

`v-memo` is a rarely-needed micro-optimization. For very large lists where each item is expensive to render, it can skip re-rendering items when their dependencies haven't changed. The Vue docs cite lists of 1000+ items as the case where it earns its keep — reach for it only after profiling.

**Incorrect (all items re-render):**

```vue
<template>
  <!-- Every item re-renders when ANY item changes -->
  <div class="item-list">
    <div
      v-for="item in items"
      :key="item.id"
      :class="{ selected: item.id === selectedId }"
      @click="selectedId = item.id"
    >
      <ExpensiveItemCard :item="item" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const items = ref(generateLargeList(1000));
  const selectedId = ref(null);
</script>
```

**Correct (only changed items re-render):**

```vue
<template>
  <div class="item-list">
    <!-- v-memo: only re-render when these deps change -->
    <div
      v-for="item in items"
      :key="item.id"
      v-memo="[item.id === selectedId, item.updatedAt]"
      :class="{ selected: item.id === selectedId }"
      @click="selectedId = item.id"
    >
      <ExpensiveItemCard :item="item" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const items = ref(generateLargeList(1000));
  const selectedId = ref(null);
</script>
```

**Must be on the same element as `v-for`:**

When using `v-memo` with `v-for`, they **must** be placed on the same element — `v-memo` does not work inside `v-for`. The `:key` value is automatically part of the memo comparison, so there is no need to include `item.id` in the deps array.

**How v-memo works:**

```vue
<template>
  <!-- v-memo takes an array of dependencies -->
  <!-- Re-render ONLY when any value in the array changes -->
  <div v-memo="[dep1, dep2, dep3]">
    <!-- Expensive content -->
  </div>
</template>
```

**Real-world example - data table:**

```vue
<template>
  <table>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.id"
        v-memo="[row.id === selectedRow, row.version]"
        :class="{ selected: row.id === selectedRow }"
        @click="selectedRow = row.id"
      >
        <td>{{ row.name }}</td>
        <td>{{ formatDate(row.createdAt) }}</td>
        <td>{{ formatCurrency(row.amount) }}</td>
        <td>
          <StatusBadge :status="row.status" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

**v-memo with empty array = v-once:**

```vue
<template>
  <!-- Equivalent to v-once -->
  <div v-memo="[]">Static content that never updates</div>
</template>
```

**When to use v-memo:**

| Scenario                               | Use v-memo?  |
| -------------------------------------- | ------------ |
| List with 1000+ items                  | Yes          |
| Items have expensive child components  | Yes          |
| Selection state changes frequently     | Yes          |
| Simple text-only items                 | Probably not |
| Small or moderate lists (< 1000 items) | Usually not  |

**Pitfall - forgetting dependencies:**

```vue
<template>
  <!-- BAD: Missing item.name as dependency -->
  <div v-memo="[item.id === selectedId]">
    {{ item.name }}
    <!-- Won't update if name changes! -->
  </div>

  <!-- GOOD: Include all reactive dependencies -->
  <div v-memo="[item.id === selectedId, item.name]">
    {{ item.name }}
  </div>
</template>
```

Reference: [v-memo](https://vuejs.org/api/built-in-directives.html#v-memo)
