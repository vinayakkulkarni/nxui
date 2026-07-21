---
title: Use the name@view.vue Convention for Named Views (Nuxt 4.5+)
impact: MEDIUM
impactDescription: File-based multi-outlet routing without manual router configuration
tags: pages, routing, named-views, NuxtPage, nuxt-4.5
---

## Use the `name@view.vue` Convention for Named Views (Nuxt 4.5+)

Nuxt 4.5 wired Vue Router's named views into file-based routing. When a parent page renders more than one `<NuxtPage>` outlet, give each extra outlet a name and provide a sibling page file using the `name@view.vue` filename convention.

**Incorrect (manual router config or prop-drilling to fake a second outlet):**

```vue
<!-- BAD: passing "sidebar content" down as props/slots because
     file-based routing "only supports one outlet" — it doesn't anymore -->
<template>
  <div>
    <NuxtPage :sidebar-content="sidebarForCurrentRoute" />
  </div>
</template>
```

**Correct (named views via filename convention):**

```
# Directory structure
-| pages/
---| parent/
-----| child.vue          → default outlet
-----| child@sidebar.vue  → "sidebar" outlet
---| parent.vue
```

```vue
<!-- pages/parent.vue -->
<template>
  <div>
    <NuxtPage />
    <aside>
      <NuxtPage name="sidebar" />
    </aside>
  </div>
</template>
```

Navigating to `/parent/child` renders `child.vue` into the default outlet and `child@sidebar.vue` into the `sidebar` outlet. An outlet with no matching named-view file stays empty.

**Limitations (from the official docs):**

| Limitation               | Detail                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `definePageMeta`         | Read from the **default** route file only — ignored in `@view` files |
| Per-view rendering modes | Not supported — the parent page's mode applies to the default view   |

**When to use:** persistent secondary panels that change per-route — sidebars, inspector panes, master-detail layouts. For content that doesn't change per-route, a plain component in the layout is simpler.

Reference: [Pages — Named Views](https://nuxt.com/docs/guide/directory-structure/app/pages#named-views)
