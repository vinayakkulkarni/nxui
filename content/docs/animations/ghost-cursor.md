---
title: Ghost Cursor
description: A ghost of glowing smoke that floats after the cursor and curls away as it rises, simulated on raw WebGL2.
---

A ghost of smoke follows the cursor on a spring, leaves a curling trail that rises and fades, and releases a puff when you click. On first mount it floats across once on its own. It runs a small fluid simulation on raw WebGL2 with no extra dependencies, renders glowing smoke on dark pages and soft ink smoke on light ones, and sleeps when idle or offscreen.

::demo-ghost-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ghost-cursor.json"
```

## Usage

The effect fills its parent (`position: absolute; inset: 0`). If the parent is `static`, it is set to `relative` while mounted. Pointer events pass through to your content.

```vue
<script setup lang="ts">
  import GhostCursor from '~/components/ui/ghost-cursor/GhostCursor.vue';

  const colorMode = useColorMode();
</script>

<template>
  <section class="relative h-125 overflow-hidden">
    <h1>Your content</h1>
    <GhostCursor
      :theme="colorMode.value === 'light' ? 'light' : 'dark'"
      :color="colorMode.value === 'light' ? '#8b6fb3' : '#B497CF'"
      :size="80"
      :trail-length="50"
      :turbulence="0.5"
      :drift="0.3"
    />
  </section>
</template>
```

## Props

| Prop                     | Type                | Default                               | Description                                                                         |
| ------------------------ | ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `color`                  | `string`            | `'#B497CF'`                           | Color of the smoke (hex or rgb). Dense parts glow lighter.                          |
| `size`                   | `number`            | `80`                                  | Size of the ghost, in px.                                                           |
| `trail-length`           | `number`            | `50`                                  | How long the smoke lingers behind the cursor, from 1 to 200.                        |
| `inertia`                | `number`            | `0.5`                                 | How far the ghost floats behind the cursor and glides on when it leaves, 0 to 0.99. |
| `turbulence`             | `number`            | `0.5`                                 | How much the smoke swirls and curls as it drifts, from 0 to 2.                      |
| `drift`                  | `number`            | `0.3`                                 | How fast the smoke rises. Negative values let it sink.                              |
| `detail`                 | `number`            | `1`                                   | How wispy the smoke is, from 0 (soft glow) to 1 (billowing wisps).                  |
| `brightness`             | `number`            | `1`                                   | Brightness of the smoke.                                                            |
| `bloom-strength`         | `number`            | `0.6`                                 | Strength of the soft glow around the smoke.                                         |
| `bloom-radius`           | `number`            | `1`                                   | How far the glow spreads, from 0 to 3.                                              |
| `bloom-threshold`        | `number`            | `0.025`                               | How bright smoke must be before it glows. Higher keeps the glow on the core.        |
| `grain-intensity`        | `number`            | `0.05`                                | Film grain over the smoke, from 0 to 1.                                             |
| `edge-intensity`         | `number`            | `0`                                   | Fades the smoke out toward the edges of the area, from 0 to 1.                      |
| `click-puff`             | `boolean`           | `true`                                | Clicking releases a puff of smoke.                                                  |
| `intro`                  | `boolean`           | `true`                                | The ghost floats across once on mount, before the cursor arrives.                   |
| `theme`                  | `'dark' \| 'light'` | `'dark'`                              | Glowing smoke for dark pages, or soft ink smoke for light ones.                     |
| `mix-blend-mode`         | `string`            | `'screen'` (dark), `'normal'` (light) | CSS blend mode for the canvas.                                                      |
| `fade-delay-ms`          | `number`            | `1000` (`500` on touch)               | Time after the cursor stops before the ghost starts to fade, in ms.                 |
| `fade-duration-ms`       | `number`            | `1500` (`1000` on touch)              | How long the fade takes, in ms.                                                     |
| `max-device-pixel-ratio` | `number`            | `2`                                   | Highest pixel ratio the canvas renders at.                                          |
| `target-pixels`          | `number`            | `600000` (`300000` on touch)          | Pixel budget for the smoke. Large areas render at a lower resolution to stay fast.  |
| `z-index`                | `number`            | `10`                                  | Stacking order of the effect over your content.                                     |
| `class`                  | `string`            | `''`                                  | Extra classes for the container.                                                    |

## Accessibility

- The canvas is decorative (`aria-hidden="true"`) and uses `pointer-events: none`, so it never blocks clicks, focus or text selection.
- With `prefers-reduced-motion: reduce` the intro flight is skipped; the ghost only appears when the user moves the pointer.
- The loop stops when the ghost has faded, when the element is offscreen, and when the tab is hidden.

- Ported from [React Bits](https://reactbits.dev/animations/ghost-cursor) by David Haz.
