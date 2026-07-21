---
title: Understand Fine-Grained Dependency Tracking in Computeds
impact: HIGH
impactDescription: Read only the properties you need to avoid over-tracking
tags: computed, dependencies, reactivity, tracking
---

## Understand Fine-Grained Dependency Tracking in Computeds

Vue's reactivity tracks dependencies **per property**, not per object. Under the hood each property read runs `track(target, key)`, so a computed depends only on the exact keys it reads — not on the whole object that contains them. Over-tracking happens only when your code reads _more_ keys than it needs.

**Per-property tracking (this is already optimal):**

```vue
<script setup>
  import { reactive, computed } from 'vue';

  const state = reactive({
    user: {
      name: 'John',
      email: 'john@example.com',
      preferences: { theme: 'dark', notifications: true },
      lastLogin: new Date(),
      sessionCount: 42,
    },
  });

  // Reading state.user.name tracks ONLY the `name` key.
  // This re-runs when name changes — NOT when email, lastLogin,
  // sessionCount, or preferences change.
  const greeting = computed(() => `Hello, ${state.user.name}!`);
</script>
```

There is nothing to "minimize" here — accessing `state.user.name` does not make the computed depend on the entire `user` object.

**Anti-pattern: reading far more keys than you need.**

```vue
<script setup>
  import { reactive, computed } from 'vue';

  const state = reactive({
    user: { name: 'John', email: 'john@example.com', sessionCount: 42 },
  });

  // BAD: JSON.stringify walks EVERY key of state, so the computed now
  // depends on every property and re-runs on any change.
  const cacheKey = computed(() => JSON.stringify(state));

  // BAD: spreading reads every own key of user — tracks all of them.
  const copy = computed(() => ({ ...state.user }));

  // BAD: iterating all keys to use just one.
  const name = computed(() => {
    for (const key of Object.keys(state.user)) {
      if (key === 'name') return state.user[key];
    }
  });
</script>
```

**Good: read exactly the properties you need.**

```vue
<script setup>
  import { reactive, computed } from 'vue';

  const state = reactive({
    user: { name: 'John', email: 'john@example.com', sessionCount: 42 },
  });

  // GOOD: depends only on `name`
  const displayName = computed(() => state.user.name);

  // GOOD: if you need a cache key, build it from the specific fields
  const cacheKey = computed(() => `${state.user.name}:${state.user.email}`);
</script>
```

**Chaining computeds is fine — Vue does not multiply recomputation.**

```vue
<script setup>
  import { ref, computed } from 'vue';

  const data = ref({ a: 1, b: 2, c: 3 });

  // Sharing `b` across two computeds does NOT cause "b counted twice".
  // Each computed re-evaluates at most once per flush, regardless of how
  // many downstream computeds depend on it.
  const sumAB = computed(() => data.value.a + data.value.b);
  const sumBC = computed(() => data.value.b + data.value.c);
  const total = computed(() => sumAB.value + sumBC.value);
</script>
```

Chaining is a legitimate way to structure complex derivations. If you flatten a chain into one computed, do it for readability — not to avoid a recomputation cost that doesn't exist:

```vue
<script setup>
  import { ref, computed } from 'vue';

  const data = ref({ a: 1, b: 2, c: 3 });

  // Equivalent result; flatten only when it reads more clearly.
  const total = computed(() => data.value.a + data.value.b + data.value.c);
</script>
```

**Separate refs vs one reactive object — a readability choice, not a tracking one.**

```vue
<script setup>
  import { reactive, ref, computed } from 'vue';

  // A reactive object does NOT re-trigger this computed on unrelated key
  // changes: reading form.name and form.email tracks only those two keys,
  // so changing form.message does not invalidate isValid.
  const form = reactive({ name: '', email: '', message: '' });
  const isValid = computed(() => form.name && form.email);

  // Splitting into separate refs is equally valid — choose based on how you
  // want to group and pass the values around, not for a tracking benefit.
  const name = ref('');
  const email = ref('');
  const message = ref('');
  const isValidRefs = computed(() => name.value && email.value);
</script>
```

Reference: [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html), [Computed Best Practices](https://vuejs.org/guide/essentials/computed.html#best-practices)
