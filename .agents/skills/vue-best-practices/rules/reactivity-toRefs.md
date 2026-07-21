---
title: Use toRefs() When Destructuring is Needed
impact: CRITICAL
impactDescription: Maintains reactivity while enabling destructuring
tags: reactivity, toRefs, destructuring, composables
---

## Use toRefs() When Destructuring is Needed

When you need to destructure a reactive object (e.g., returning from a composable), use `toRefs()` to maintain reactivity.

**Incorrect (loses reactivity when returned):**

```typescript
// composables/useCounter.ts
import { reactive } from 'vue';

export function useCounter() {
  const state = reactive({
    count: 0,
    doubleCount: 0,
  });

  function increment() {
    state.count++;
    state.doubleCount = state.count * 2;
  }

  // BAD: Destructuring here loses reactivity
  return {
    ...state, // count and doubleCount are now plain values!
    increment,
  };
}

// In component - won't be reactive
const { count, increment } = useCounter();
```

**Correct (using toRefs):**

```typescript
// composables/useCounter.ts
import { reactive, toRefs } from 'vue';

export function useCounter() {
  const state = reactive({
    count: 0,
    doubleCount: 0,
  });

  function increment() {
    state.count++;
    state.doubleCount = state.count * 2;
  }

  return {
    ...toRefs(state), // Each property becomes a ref
    increment,
  };
}

// In component - fully reactive
const { count, doubleCount, increment } = useCounter();
// count.value and doubleCount.value are reactive
```

**Alternative: Return refs directly:**

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter() {
  const count = ref(0);
  const doubleCount = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return {
    count,
    doubleCount,
    increment,
  };
}
```

**Use toRef() for single properties:**

```typescript
import { reactive, toRef } from 'vue';

const state = reactive({
  count: 0,
  name: 'Vue',
});

// Extract single property as ref
const countRef = toRef(state, 'count');
countRef.value++; // Updates state.count
```

**Since Vue 3.3, `toRef()` also has a normalization signature** that accepts a getter, which is the idiomatic way to pass a live value into a composable:

```typescript
import { toRef, toValue } from 'vue';

// toRef(() => x) normalizes a getter into a readonly ref
const titleRef = toRef(() => props.title);

// Inside a composable, use toValue() to consume MaybeRefOrGetter inputs
// (accepts a plain value, a ref, or a getter)
function useFeature(input: MaybeRefOrGetter<string>) {
  const value = toValue(input); // resolves ref | getter | raw value
  // ...
}
```

**Passing a prop into a composable (recommended):**

Since Vue 3.5 destructured props are reactive, and the docs-recommended way to feed a prop into a composable is a getter — this keeps the value live without snapshotting it:

```vue
<script setup>
  const props = defineProps<{
    title: string
    count: number
  }>()

  // GOOD: pass a getter so the composable tracks the latest prop value
  useFeature(() => props.title)

  // GOOD (3.3+): toRef with a getter produces a readonly ref
  const countRef = toRef(() => props.count)
</script>
```

**Props pattern with toRefs (valid but legacy):**

```vue
<script setup>
  import { toRefs } from 'vue'

  const props = defineProps<{
    title: string
    count: number
  }>()

  // Still works, but a getter (above) is now the preferred way to
  // pass a single prop into a composable
  const { title, count } = toRefs(props)
</script>
```

Reference: [toRefs](https://vuejs.org/api/reactivity-utilities.html#torefs), [toValue](https://vuejs.org/api/reactivity-utilities.html#tovalue)
