---
title: Wire Prefetch Manually in NuxtLink Custom Slots (Nuxt 4.5+)
impact: MEDIUM
impactDescription: Custom-slot links silently lose prefetching unless wired via the new slot props
tags: pages, routing, NuxtLink, prefetch, custom-slot, nuxt-4.5
---

## Wire Prefetch Manually in NuxtLink Custom Slots (Nuxt 4.5+)

`<NuxtLink custom>` has never attached prefetch handlers automatically — Nuxt can't know how you structured your markup. As of 4.5, the slot exposes `prefetch`, `prefetched`, and `shouldPrefetch` so you can wire prefetching yourself. If you migrate a link to `custom` and skip this, the link silently loses prefetching.

**Incorrect (custom slot with no prefetch wiring):**

```vue
<template>
  <!-- BAD: renders fine, but never prefetches — perceived nav gets slower -->
  <NuxtLink v-slot="{ href, navigate }" to="/about" custom>
    <a :href="href" @click="navigate">About page</a>
  </NuxtLink>
</template>
```

**Correct (wire the new slot props):**

```vue
<template>
  <NuxtLink
    v-slot="{ href, navigate, prefetch, prefetched, shouldPrefetch }"
    to="/about"
    custom
  >
    <a
      :href="href"
      :class="{ 'is-prefetched': prefetched }"
      @click="navigate"
      @pointerenter="shouldPrefetch('interaction') && prefetch()"
      @focus="shouldPrefetch('interaction') && prefetch()"
    >
      About page
    </a>
  </NuxtLink>
</template>
```

**The three slot props:**

| Prop                      | Purpose                                                                   |
| ------------------------- | ------------------------------------------------------------------------- |
| `prefetch()`              | Triggers prefetching of the destination                                   |
| `prefetched`              | `true` once the destination is prefetched (drive a CSS class from it)     |
| `shouldPrefetch(trigger)` | Respects the user's connection + link config before you call `prefetch()` |

**What `custom` opts you out of** — none of these apply automatically anymore:

- Prefetch handlers (`prefetchOn` behavior)
- `prefetchedClass`

**When NOT to use `custom`:** if you don't need to restructure the markup, a plain `<NuxtLink>` keeps automatic prefetching. Reach for `custom` only when wrapping the link in a component library primitive or non-`<a>` markup.

Reference: [NuxtLink](https://nuxt.com/docs/api/components/nuxt-link) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)
