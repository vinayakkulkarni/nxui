---
title: Use kebab-case Emits with Full Type Definitions
impact: MEDIUM
impactDescription: Ensures consistent event naming and type safety
tags: types, emits, vue, conventions, kebab-case
---

## Use kebab-case Emits with Full Type Definitions

All Vue component emits MUST use kebab-case consistently across `defineEmits`, `emit()` calls, and template event handlers.

**Incorrect (camelCase emits):**

```vue
<script setup lang="ts">
// ❌ WRONG - camelCase in defineEmits
const emit = defineEmits<{
  manageSubscription: []  // NO! Use kebab-case
  toggleVisibility: [id: string, visible: boolean]  // NO!
  updateValue: [value: number]  // NO!
}>()

// Inconsistent emit calls
emit('manageSubscription')
emit('toggleVisibility', id, true)
</script>
```

**Correct (kebab-case everywhere):**

```vue
<script setup lang="ts">
// ✅ CORRECT - kebab-case with quotes in defineEmits
const emit = defineEmits<{
  'manage-subscription': []
  'toggle-visibility': [id: string, visible: boolean]
  'update-value': [value: number]
}>()

// Consistent emit calls
emit('manage-subscription')
emit('toggle-visibility', id, true)
emit('update-value', 42)
</script>
```

**Parent component usage:**

```vue
<template>
  <!-- kebab-case in template event handlers -->
  <ChildComponent
    @manage-subscription="handleManageSubscription"
    @toggle-visibility="handleToggleVisibility"
    @update-value="handleUpdateValue"
  />
</template>

<script setup lang="ts">
function handleManageSubscription() {
  // ...
}

function handleToggleVisibility(id: string, visible: boolean) {
  // ...
}

function handleUpdateValue(value: number) {
  // ...
}
</script>
```

**With v-model:**

```vue
<!-- Child component -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

// v-model emits use 'update:modelValue' pattern
const emit = defineEmits<{
  'update:model-value': [value: string]  // kebab-case
}>()

function updateValue(newValue: string) {
  emit('update:model-value', newValue)
}
</script>

<!-- Parent usage -->
<template>
  <MyInput v-model="text" />
  <!-- Or explicitly -->
  <MyInput :model-value="text" @update:model-value="text = $event" />
</template>
```

**Named function handlers (avoid inline arrows):**

```vue
<!-- ❌ WRONG - Inline arrow with multiple params -->
<template>
  <LayerTree
    @toggle-visibility="(layerId, visible) => emit('toggle-layer-visibility', layerId, visible)"
  />
</template>

<!-- ✅ CORRECT - Named function -->
<script setup>
function handleToggleVisibility(layerId: string, visible: boolean) {
  emit('toggle-layer-visibility', layerId, visible)
}
</script>

<template>
  <LayerTree @toggle-visibility="handleToggleVisibility" />
</template>
```

**The pattern summary:**

| Location | Format | Example |
|----------|--------|---------|
| `defineEmits` type | `'kebab-case'` (quoted) | `'manage-subscription': []` |
| `emit()` call | `'kebab-case'` | `emit('manage-subscription')` |
| Template `@event` | `@kebab-case` | `@manage-subscription="handler"` |

**Why kebab-case?**

1. Consistency with HTML attribute conventions
2. Makes event names grep-able across templates and scripts
3. Avoids confusion between JS camelCase and HTML kebab-case
4. Matches Vue's official style guide

Reference: [Vue Style Guide - Events](https://vuejs.org/style-guide/rules-strongly-recommended.html#component-event-casing)
