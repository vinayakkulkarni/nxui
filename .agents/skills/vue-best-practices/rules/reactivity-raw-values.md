---
title: Treat toRaw() as a Narrow Escape Hatch, Not a Read Optimization
impact: HIGH
impactDescription: Avoids fragile, untracked reads on reactive data
tags: reactivity, toRaw, shallowRef, escape-hatch
---

## Treat toRaw() as a Narrow Escape Hatch, Not a Read Optimization

The documented fix for reactivity overhead on large data is `shallowRef` / `shallowReactive` (see the shallowRef rule) — reach for those, not for sprinkling `toRaw()` at every read site. `toRaw()` is an escape hatch, and the docs are explicit: it is **NOT** recommended to hold a persistent reference to the original object, and it should be used **with caution**.

**Prefer shallow reactivity for large read-heavy data:**

```typescript
import { shallowRef } from 'vue';

// GOOD: skip deep proxying up front, so reads never pay proxy overhead
const items = shallowRef<Item[]>(generateLargeDataset(10000));

function searchItems(query: string) {
  // No per-item proxy: items.value is a plain array
  return items.value.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
}
```

**toRaw() as an escape hatch (use with caution):**

```typescript
import { ref, toRaw } from 'vue';

const items = ref<Item[]>(generateLargeDataset(10000));

function snapshotForExternalLib() {
  // Escape hatch: hand a non-proxied object to code that can't handle proxies.
  // Do NOT store this reference long-term — mutating it won't trigger updates,
  // and Vue may replace the underlying raw object.
  return toRaw(items.value);
}
```

> Docs: "It is **not** recommended to hold a persistent reference to the original object. Use with caution." — [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw)

**Raw reads inside a computed are untracked — a trap:**

```typescript
import { ref, toRaw, computed } from 'vue';

const allProducts = ref<Product[]>([]);
const searchQuery = ref('');

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase(); // tracks searchQuery
  if (!query) return allProducts.value;

  // WARNING: toRaw() reads are NOT tracked. This only recomputes on future
  // changes because the reactive source (allProducts.value) is read first to
  // establish tracking. If you read ONLY the raw object, the computed would
  // never invalidate. Prefer shallowRef for this case instead of toRaw here.
  const raw = toRaw(allProducts.value);
  return raw.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query),
  );
});
```

The reactive source must still be read to establish tracking; the raw read itself contributes no dependency. If you find yourself doing this, a `shallowRef` for `allProducts` is the cleaner, less fragile fix.

**Legitimate use case — non-cloneable proxies (Web Workers, structured clone):**

```typescript
import { ref, toRaw } from 'vue';

const data = ref(complexData);

// Reactive proxies are not structured-cloneable, so postMessage would throw.
// toRaw() unwraps to the plain object the worker can receive.
worker.postMessage(toRaw(data.value));
```

This is the canonical `toRaw()` case: an API (`postMessage`, `structuredClone`, IndexedDB) rejects proxies and you need the plain object for a one-shot hand-off.

**When toRaw() is appropriate:**

| Scenario                                                             | Use toRaw?                              |
| -------------------------------------------------------------------- | --------------------------------------- |
| Passing to an API that rejects proxies (Web Worker, structuredClone) | Yes — one-shot hand-off                 |
| Large read-heavy datasets                                            | No — use `shallowRef`/`shallowReactive` |
| Reads inside a computed                                              | No — untracked; use shallow reactivity  |
| Holding a long-lived reference to the raw object                     | No — docs advise against it             |
| Modifying data (need reactivity to trigger)                          | No                                      |

**Note:** The value returned from `toRaw()` should be treated as read-only. Mutating it won't trigger reactivity updates.

Reference: [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw)
