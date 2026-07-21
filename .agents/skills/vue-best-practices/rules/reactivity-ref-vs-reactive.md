---
title: Prefer ref() as the Primary Reactivity API
impact: CRITICAL
impactDescription: Prevents reactivity loss and unexpected bugs
tags: reactivity, ref, reactive, primitives, objects
---

## Prefer ref() as the Primary Reactivity API

The official docs recommend using `ref()` as the primary API for declaring reactive state — for primitives _and_ objects. A `ref()` deep-wraps objects and arrays, so it gives you the same deep reactivity as `reactive()` without any of its limitations. Reach for `reactive()` only when you specifically want an object-only proxy and can live with its caveats.

**Incorrect (reactive with a primitive):**

```typescript
// reactive() doesn't work with primitives - this won't be reactive!
const count = reactive(0); // TypeScript error, but runtime issue in JS

// Or wrapping a primitive in an object unnecessarily
const state = reactive({ count: 0 });
// Now you must always access state.count instead of just count
```

**Correct (ref for primitives):**

```typescript
import { ref } from 'vue';

// Use ref() for primitives
const count = ref(0);
const name = ref('');
const isLoading = ref(false);

// Access with .value in script, auto-unwrapped in template
count.value++;
```

**Correct (ref for objects too — the recommended default):**

```typescript
import { ref } from 'vue';

// ref() deep-wraps the object: nested properties are reactive
const user = ref({
  name: 'John',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
  },
});

// Access through .value in script
user.value.name = 'Jane';
user.value.preferences.theme = 'light';

// You can also replace the whole object without losing reactivity
user.value = {
  name: 'Ada',
  email: 'ada@example.com',
  preferences: { theme: 'light' },
};
```

**Acceptable (reactive for object-only state):**

```typescript
import { reactive } from 'vue';

// reactive() works only for objects and avoids the .value ceremony
const user = reactive({
  name: 'John',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
  },
});

// Direct property access
user.name = 'Jane';
user.preferences.theme = 'light';
```

**Limitations of `reactive()` (per docs) — the reasons to prefer `ref()`:**

1. It cannot hold primitive types (string, number, boolean) — only objects, arrays, and collection types.
2. You cannot replace the whole object without losing the reactivity connection (e.g. `user = { ... }` on a reactive binding drops reactivity), so it is hard to swap out wholesale.
3. Destructuring breaks reactivity — pulling a primitive property out of a reactive object detaches it (use `toRefs()` if you must destructure).

**When to use which:**

| Type                                  | Use                   | Reason                                                        |
| ------------------------------------- | --------------------- | ------------------------------------------------------------- |
| Primitives (string, number, boolean)  | `ref()`               | reactive() doesn't work with primitives                       |
| Single value that gets reassigned     | `ref()`               | Can reassign `.value` directly                                |
| Objects with nested properties        | `ref()` (default)     | Primary recommended API; deep reactive, safe to replace whole |
| Object-only state, no `.value` wanted | `reactive()` (opt-in) | Cleaner access, but accept the limitations above              |
| Arrays you iterate over               | `ref()`               | Deep reactive and safe to reassign the whole array            |

Reference: [Vue Reactivity Fundamentals - Limitations of reactive()](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive)
