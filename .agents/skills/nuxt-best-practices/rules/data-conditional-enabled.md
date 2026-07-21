---
title: Use the enabled Option for Conditional Data Fetching (Nuxt 4.5+)
impact: HIGH
impactDescription: Replaces fragile immediate/watch workarounds and prevents wasted requests
tags: data-fetching, useFetch, useAsyncData, enabled, conditional, nuxt-4.5
---

## Use the `enabled` Option for Conditional Data Fetching (Nuxt 4.5+)

Nuxt 4.5 added a reactive `enabled` option to `useFetch` and `useAsyncData`. While `enabled` evaluates to `false`, every execution path is blocked — the initial fetch, `execute()`/`refresh()` calls, and `watch` triggers. Flipping it from `true` to `false` mid-flight cancels the in-flight request without clearing existing `data`.

Before 4.5, conditional fetching required hand-rolled combinations of `immediate: false`, external watchers, and guard clauses. Don't write those anymore.

**Incorrect (hand-rolled precondition guards):**

```vue
<script setup lang="ts">
  const query = ref('');

  // BAD: immediate: false + manual watch + guard — fragile and verbose
  const { data, execute } = await useFetch('/api/search', {
    query: { q: query },
    immediate: false,
  });

  watch(query, (value) => {
    // Guard duplicated everywhere execute() is called
    if (value.length > 2) {
      execute();
    }
  });
</script>
```

**Correct (reactive `enabled` gate):**

```vue
<script setup lang="ts">
  const query = ref('');

  // GOOD: one reactive barrier — no watcher, no guards
  const { data } = await useFetch('/api/search', {
    query: { q: query },
    // Only fetch once the user has typed something
    enabled: () => query.value.length > 2,
  });
</script>
```

**Dependent (chained) queries:**

```vue
<script setup lang="ts">
  // Second request depends on the first one resolving
  const { data: user } = await useFetch('/api/me');

  const { data: orders } = await useFetch(
    () => `/api/users/${user.value?.id}/orders`,
    {
      // Blocks until the user is loaded
      enabled: () => !!user.value?.id,
    },
  );
</script>
```

**Accepted values** — `enabled` is `MaybeRefOrGetter<boolean>`:

```ts
enabled: true; // static
enabled: someBooleanRef; // ref
enabled: computed(() => cond); // computed
enabled: () => cond; // getter
```

**Exact semantics:**

| Behavior               | What happens                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `enabled` is `false`   | Initial fetch, `execute()`, `refresh()`, and watch triggers blocked |
| Flips `true` → `false` | In-flight request cancelled; existing `data` retained               |
| Data on disable        | **Kept** — not cleared (call `clear()` yourself if needed)          |
| Flips `false` → `true` | Does NOT auto-refetch — a trigger (watch/execute) must fire         |

**`enabled` vs `immediate` — they solve different problems:**

| Requirement                                             | Use                              |
| ------------------------------------------------------- | -------------------------------- |
| Block all execution until a reactive condition is met   | `enabled`                        |
| Skip only the initial auto-fetch, fetch later on demand | `immediate: false` + `execute()` |
| Fetch on explicit user action (button click)            | `immediate: false` + `execute()` |
| Cancel in-flight work when a condition becomes false    | reactive `enabled`               |

`immediate: false` is not deprecated — it remains the right tool for user-triggered fetching. `enabled` supersedes the awkward `immediate: false` + external-watch pattern only when the gate is a reactive precondition.

**Note:** Cancellation works because `$fetch` honors the injected `AbortSignal`. If you pass a custom handler to `useAsyncData`, accept and forward the signal: `(_ctx, { signal }) => $fetch(url, { signal })`.

Reference: [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) | [useFetch](https://nuxt.com/docs/api/composables/use-fetch) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)
