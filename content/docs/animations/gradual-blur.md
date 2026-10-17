---
title: Gradual Blur
description: Progressive edge blur for headers, footers, captions and carousels, with an optional fade to color that hides at the ends of a scroll.
---

Gradual Blur softens one edge of a container with stacked backdrop-filter layers. Each layer adds only the blur that is still missing, so the ramp has no visible steps. Fade it into a color, boost the color behind it, clear it on hover, or let it hide itself when a scroll reaches that edge. Scroll the feed, switch scenes and presets in the panel.

::demo-gradual-blur
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradual-blur.json"
```

## Usage

Place it inside a positioned parent. With `auto-hide`, it watches a scrollable sibling (or the parent) and fades out at the end of the scroll.

```vue
<script setup lang="ts">
  import GradualBlur from '~/components/ui/gradual-blur/GradualBlur.vue';
</script>

<template>
  <div class="relative h-125 overflow-hidden">
    <div class="h-full overflow-y-auto">
      <!-- long scrolling content -->
    </div>
    <GradualBlur position="top" tint="rgba(18, 15, 23, 0.6)" auto-hide />
    <GradualBlur position="bottom" tint="rgba(18, 15, 23, 0.6)" auto-hide />
  </div>
</template>
```

## Props

| Prop              | Type                                                               | Default         | Description                                                                                          |
| ----------------- | ------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| `position`        | `'top' \| 'bottom' \| 'left' \| 'right'`                           | `'bottom'`      | Edge the blur grows toward.                                                                          |
| `target`          | `'parent' \| 'page'`                                               | `'parent'`      | Sit inside the nearest positioned parent, or stay fixed to the edge of the viewport.                 |
| `height`          | `string \| number`                                                 | `'6rem'`        | How far the blur reaches in from the edge. For left and right this is its width. Numbers are px.     |
| `width`           | `string \| number`                                                 | `-`             | For top and bottom, a narrower centered band. For left and right, overrides height.                  |
| `strength`        | `number`                                                           | `2`             | How blurry the very edge gets. Each step adds about 12px of blur.                                    |
| `layers`          | `number`                                                           | `8`             | Blur layers across the ramp, 1 to 16. More layers give a smoother falloff, fewer show steps.         |
| `curve`           | `'linear' \| 'bezier' \| 'ease-in' \| 'ease-out' \| 'ease-in-out'` | `'linear'`      | How the blur builds across the ramp. `bezier` is a smooth S-curve.                                   |
| `exponential`     | `boolean`                                                          | `true`          | Doubles the blur toward the edge so it starts gently. Turn off for an even ramp.                     |
| `opacity`         | `number`                                                           | `1`             | Opacity of the blur layers. Lower values let the sharp content show through.                         |
| `saturation`      | `number`                                                           | `1`             | Color boost of the blurred content, building toward the edge, for a glassy look.                     |
| `tint`            | `string`                                                           | `'transparent'` | Color the content fades into at the edge, such as your page background. Use rgba for a lighter wash. |
| `auto-hide`       | `boolean`                                                          | `false`         | Fades the blur out when the scroll container reaches this edge.                                      |
| `container`       | `string \| HTMLElement \| null`                                    | `null`          | Scroll container watched by `auto-hide`. Defaults to a scrollable sibling, the parent, or the page.  |
| `hover-intensity` | `number`                                                           | `1`             | Multiplies the blur while the cursor is over it. 0 clears it on hover, 2 doubles it.                 |
| `duration`        | `number \| string`                                                 | `0.3`           | Length of the hover and auto-hide transitions, in seconds or as a CSS time.                          |
| `easing`          | `string`                                                           | `'ease-out'`    | CSS easing of those transitions.                                                                     |
| `z-index`         | `number`                                                           | `1000`          | Stacking order of the overlay.                                                                       |
| `class`           | `string`                                                           | `''`            | Extra classes for the overlay.                                                                       |

## Accessibility

- The overlay is decorative (`aria-hidden="true"`) and uses `pointer-events: none`, so content under it stays clickable and selectable.
- Hover detection reads pointer position on the window, so it never steals events from the content below.
- Blur and tint are CSS only; there is no animation loop.

- Ported from [React Bits](https://reactbits.dev/animations/gradual-blur) by David Haz.
