---
title: Type Emits Fully with camelCase Declarations
impact: MEDIUM
impactDescription: Ensures consistent event naming and type safety
tags: types, emits, vue, conventions, v-model
---

## Type Emits Fully with camelCase Declarations

Declare and emit events in camelCase; listen in kebab-case in templates. Vue's automatic case transformation bridges the two, so this is the documented convention — NOT kebab-case declarations. Always type emits fully with the 3.3+ named-tuple syntax; never use untyped emits.

**Incorrect (kebab-case declarations / untyped emits):**

```vue
<script setup lang="ts">
  // ❌ WRONG - kebab-case in defineEmits contradicts Vue's convention
  const emit = defineEmits<{
    'manage-subscription': [];
    'update-value': [value: number];
  }>();

  // ❌ WRONG - untyped emits (no payload types)
  const emit = defineEmits(['manageSubscription', 'updateValue']);
</script>
```

**Correct (camelCase declarations, 3.3+ named-tuple syntax):**

```vue
<script setup lang="ts">
  // ✅ CORRECT - declare emits in camelCase with typed payloads
  const emit = defineEmits<{
    change: [id: number];
    updateValue: [value: string];
  }>();

  // Emit in camelCase
  emit('change', 1);
  emit('updateValue', 'hello');
</script>
```

**Parent component usage (listen in kebab-case):**

```vue
<template>
  <!-- Listen in kebab-case — Vue transforms camelCase ↔ kebab-case automatically -->
  <ChildComponent @change="handleChange" @update-value="handleUpdateValue" />
</template>

<script setup lang="ts">
  function handleChange(id: number) {
    // ...
  }

  function handleUpdateValue(value: string) {
    // ...
  }
</script>
```

**With v-model — the event MUST be `update:modelValue` (camelCase):**

`v-model` requires the event name `update:modelValue` matching the `modelValue` prop. `'update:model-value'` (kebab-case) breaks `v-model`.

```vue
<!-- Child component -->
<script setup lang="ts">
  const props = defineProps<{
    modelValue: string;
  }>();

  // ✅ CORRECT - camelCase 'update:modelValue' matches the modelValue prop
  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  function updateValue(newValue: string) {
    emit('update:modelValue', newValue);
  }
</script>

<!-- Parent usage -->
<template>
  <MyInput v-model="text" />
  <!-- Or explicitly -->
  <MyInput :model-value="text" @update:model-value="text = $event" />
</template>
```

**Preferred (Vue 3.4+): use `defineModel()` for v-model bindings:**

`defineModel()` is the modern macro for v-model — it wires the `modelValue` prop and `update:modelValue` event for you.

```vue
<!-- Child component -->
<script setup lang="ts">
  // Two-way binding — no manual prop + emit needed
  const model = defineModel<string>();

  function updateValue(newValue: string) {
    model.value = newValue;
  }
</script>
```

**Named function handlers (avoid inline arrows):**

```vue
<!-- ❌ WRONG - Inline arrow with multiple params -->
<template>
  <LayerTree
    @toggle-visibility="
      (layerId, visible) => emit('toggleLayerVisibility', layerId, visible)
    "
  />
</template>

<!-- ✅ CORRECT - Named function -->
<script setup lang="ts">
  const emit = defineEmits<{
    toggleLayerVisibility: [layerId: string, visible: boolean];
  }>();

  function handleToggleVisibility(layerId: string, visible: boolean) {
    emit('toggleLayerVisibility', layerId, visible);
  }
</script>

<template>
  <LayerTree @toggle-visibility="handleToggleVisibility" />
</template>
```

**The pattern summary:**

| Location           | Format                          | Example                        |
| ------------------ | ------------------------------- | ------------------------------ |
| `defineEmits` type | camelCase, typed named-tuple    | `updateValue: [value: string]` |
| `emit()` call      | camelCase                       | `emit('updateValue', v)`       |
| Template `@event`  | kebab-case (auto-transformed)   | `@update-value="handler"`      |
| v-model event      | `update:modelValue` (camelCase) | `emit('update:modelValue', v)` |

**Why this convention?**

1. Matches Vue's documented case-transformation behavior (declare/emit camelCase, listen kebab-case)
2. `update:modelValue` must stay camelCase or `v-model` breaks
3. Full payload typing catches wrong-argument bugs at compile time
4. `defineModel()` removes the manual prop+emit boilerplate for two-way bindings

Reference: [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) | [Component Events](https://vuejs.org/guide/components/events.html)
