---
title: Avoid Deep Watchers on Large Objects
impact: HIGH
impactDescription: Prevents expensive deep comparison on every change
tags: watch, deep, performance, optimization
---

## Avoid Deep Watchers on Large Objects

Deep watchers traverse entire object trees on every change. For large objects, this is expensive and often unnecessary.

**Implicit vs. explicit deep — know which you have:** `watch(reactiveObj, cb)` — watching a reactive object directly — is **implicitly deep**; it fires on every nested mutation. A getter source like `watch(() => obj.prop, cb)` is **shallow** by default and only fires when the returned value is replaced, unless you pass `{ deep: true }`. This governs when `deep` is even needed: you only reach for it on getter/ref sources.

**Incorrect (deep watch on large object):**

```vue
<script setup>
  import { reactive, watch } from 'vue';

  const state = reactive({
    users: [], // Could be 1000+ users
    settings: {/* nested settings */},
    cache: {/* large cache object */},
  });

  // BAD: Deep traverses entire state tree on ANY change
  watch(
    () => state,
    (newState) => {
      console.log('State changed');
      saveToLocalStorage(newState);
    },
    { deep: true },
  );
</script>
```

**Correct (watch specific properties):**

```vue
<script setup>
  import { reactive, watch } from 'vue';

  const state = reactive({
    users: [],
    settings: { theme: 'dark', language: 'en' },
    cache: {},
  });

  // GOOD: Watch only what you need
  watch(
    () => state.settings.theme,
    (newTheme) => {
      document.body.className = newTheme;
    },
  );

  // GOOD: Watch multiple specific properties
  watch(
    () => [state.settings.theme, state.settings.language],
    ([theme, language]) => {
      updateUIPreferences(theme, language);
    },
  );
</script>
```

**If you must watch an object, use getter:**

```vue
<script setup>
  import { reactive, watch } from 'vue';

  const user = reactive({
    name: 'John',
    email: 'john@example.com',
    profile: {
      avatar: 'url',
      bio: 'text',
    },
  });

  // Watch for object replacement (shallow)
  watch(
    () => user.profile,
    (newProfile) => {
      // Only triggers when profile is replaced entirely
      saveProfile(newProfile);
    },
  );

  // If you need deep but only for profile
  watch(
    () => user.profile,
    (newProfile) => {
      saveProfile(newProfile);
    },
    { deep: true }, // Deep only on profile, not entire user
  );
</script>
```

**Cap traversal depth (Vue 3.5+):**

`deep` can also be a number, limiting how many levels Vue traverses — the documented middle ground between a shallow watch and a full deep traversal.

```vue
<script setup>
  import { reactive, watch } from 'vue';

  const state = reactive({ nested: { level1: { level2: 'deep' } } });

  // Only traverse two levels deep, not the entire tree
  watch(() => state.nested, saveState, { deep: 2 });
</script>
```

**Use watchEffect for reactive tracking:**

```vue
<script setup>
  import { reactive, watchEffect } from 'vue';

  const settings = reactive({
    theme: 'dark',
    fontSize: 14,
    language: 'en',
  });

  // Automatically tracks only accessed properties
  watchEffect(() => {
    // Only re-runs when theme or fontSize changes
    // NOT when language changes (not accessed here)
    document.body.style.fontSize = `${settings.fontSize}px`;
    document.body.className = settings.theme;
  });
</script>
```

**Caveat:** `watchEffect` only tracks dependencies accessed **synchronously before the first `await`**. Anything read after an `await` inside the callback is not tracked.

**Alternative: Derive a watched value:**

```vue
<script setup>
  import { reactive, computed, watch } from 'vue';

  const items = reactive([/* large array */]);

  // Compute a simple value to watch
  const itemCount = computed(() => items.length);
  const hasActiveItem = computed(() => items.some((item) => item.active));

  // Watch the simple computed value
  watch(itemCount, (count) => {
    console.log(`Item count changed to ${count}`);
  });

  watch(hasActiveItem, (hasActive) => {
    if (hasActive) notifyUser();
  });
</script>
```

**When deep watch is acceptable:**

| Scenario            | Use deep?                     |
| ------------------- | ----------------------------- |
| Small config object | OK                            |
| User preferences    | OK                            |
| Form state          | Consider splitting            |
| Large arrays        | No - watch length or computed |
| API response cache  | No                            |

The "small config object" threshold is a rule-of-thumb (roughly under a couple dozen properties), not a number from the Vue docs — profile if unsure.

Reference: [Watchers](https://vuejs.org/guide/essentials/watchers.html)
