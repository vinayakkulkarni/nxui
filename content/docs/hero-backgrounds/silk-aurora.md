---
title: Silk Aurora
description: Premium WebGL hero with satin-dark aurora ribbons, pearlescent highlights, fine film grain, and cursor depth that bends the light toward the pointer.
---

::demo-silk-aurora
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/silk-aurora.json"
```

## Usage

```vue
<script setup lang="ts">
  import SilkAurora from '~/components/ui/silk-aurora/SilkAurora.vue';
</script>

<template>
  <SilkAurora
    subtitle="Silk Aurora"
    title="Night skies, woven in satin"
    description="Satin-dark aurora ribbons with pearlescent highlights."
    sheen-color="#f4dfb8"
    accent-color="#6ed6c9"
    class="min-h-screen"
  >
    <button class="rounded-full bg-white px-6 py-3 text-black">
      Get started
    </button>
  </SilkAurora>
</template>
```

Three fbm-warped ribbons drift across a satin-dark field with a pearlescent
sheen, sparkle glints, film grain, and a vignette. The pointer bends nearby
light toward it (`mouse-influence`). Headline scales with container-query
units. Falls back to a static radial gradient without WebGL and freezes when
`prefers-reduced-motion` is set. Distinct from nxui's `silk`, `aurora`, and
`soft-aurora` — this is the combined satin-ribbon hero, content slots
included.

## Props

| Prop              | Type      | Default     | Description                      |
| ----------------- | --------- | ----------- | -------------------------------- |
| `title`           | `string`  | —           | Headline over the aurora         |
| `subtitle`        | `string`  | —           | Uppercase kicker above the title |
| `description`     | `string`  | —           | Supporting paragraph             |
| `base-color`      | `string`  | `'#050507'` | Deep background hex              |
| `mid-color`       | `string`  | `'#14151d'` | Upper-atmosphere hex             |
| `sheen-color`     | `string`  | `'#f4dfb8'` | Pearlescent sheen hex            |
| `accent-color`    | `string`  | `'#6ed6c9'` | Ribbon accent hex                |
| `speed`           | `number`  | `1`         | Animation speed multiplier       |
| `intensity`       | `number`  | `1`         | Ribbon/sheen intensity           |
| `grain`           | `number`  | `0.85`      | Film grain amount (0–1)          |
| `vignette`        | `number`  | `1`         | Vignette strength (0–1)          |
| `mouse-influence` | `number`  | `1`         | Cursor depth multiplier          |
| `interactive`     | `boolean` | `true`      | React to pointer movement        |

## Slots

| Slot      | Description                             |
| --------- | --------------------------------------- |
| `default` | CTA area rendered below the description |

## Credits

- Ported from [componentry.fun](https://www.componentry.dev/docs/components/silk-aurora)
