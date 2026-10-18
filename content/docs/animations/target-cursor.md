---
title: Target Cursor
description: A reticle cursor whose corner brackets snap around targets, matching their shape.
---

A spinning reticle replaces the mouse cursor. Move it over any element with the `cursor-target` class and the four corner brackets snap around it, follow its corner radius and show its `data-cursor-label`. Hold the mouse button to squeeze the brackets. Pass `container` to keep the cursor inside one area.

::demo-target-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/target-cursor.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import TargetCursor from '~/components/ui/target-cursor/TargetCursor.vue';

  const stage = ref<HTMLElement>();
</script>

<template>
  <div ref="stage" class="grid h-125 place-items-center gap-4">
    <img
      class="cursor-target rounded-[20px]"
      data-cursor-label="View"
      src="/sky.webp"
      alt=""
    />
    <button class="cursor-target rounded-xl" data-cursor-label="Play">
      Play
    </button>
  </div>
  <TargetCursor
    :container="stage"
    cursor-color="#ffffff"
    blend-mode="difference"
  />
</template>
```

The cursor is teleported to `<body>` and only mounts on devices with a fine pointer that can hover, so touch screens keep their normal behaviour. All motion runs on springs in one `requestAnimationFrame` loop that sleeps when nothing moves.

## Props

| Prop                     | Type                                                                             | Default            | Description                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `target-selector`        | `string`                                                                         | `'.cursor-target'` | CSS selector for the elements the brackets lock onto.                              |
| `cursor-color`           | `string`                                                                         | `'#ffffff'`        | Color of the brackets and dot.                                                     |
| `cursor-color-on-target` | `string`                                                                         | —                  | Color the cursor blends to while locked onto a target.                             |
| `spin-duration`          | `number`                                                                         | `2`                | Seconds per turn while the cursor roams. `0` stops the spin.                       |
| `hover-duration`         | `number`                                                                         | `0.2`              | How long the brackets take to snap onto a target, in seconds.                      |
| `parallax-on`            | `boolean`                                                                        | `true`             | Lets the locked brackets lean slightly toward the cursor.                          |
| `hide-default-cursor`    | `boolean`                                                                        | `true`             | Hides the system cursor while this cursor is shown.                                |
| `size`                   | `number`                                                                         | `36`               | Size of the reticle while roaming, in px.                                          |
| `corner-size`            | `number`                                                                         | `12`               | Length of each bracket arm, in px.                                                 |
| `thickness`              | `number`                                                                         | `3`                | Stroke width of the brackets, in px.                                               |
| `padding`                | `number`                                                                         | `6`                | Gap between a locked target and the brackets, in px.                               |
| `match-radius`           | `boolean`                                                                        | `true`             | Rounds the brackets to follow the target's corner radius.                          |
| `dot-size`               | `number`                                                                         | `4`                | Size of the center dot, in px. `0` hides it.                                       |
| `blend-mode`             | `'normal' \| 'difference' \| 'exclusion' \| 'multiply' \| 'screen' \| 'overlay'` | `'difference'`     | CSS blend mode of the cursor. Difference keeps it visible on any background.       |
| `show-label`             | `boolean`                                                                        | `true`             | Shows the `data-cursor-label` text of a locked target above the brackets.          |
| `click-effect`           | `boolean`                                                                        | `true`             | Squeezes the brackets and dot while the mouse button is held.                      |
| `container`              | `HTMLElement \| string \| null`                                                  | `null`             | Limits the cursor to one element or selector. By default it works across the page. |

## Accessibility

- The cursor layer is `aria-hidden` and `pointer-events: none`; it never takes focus or blocks clicks.
- It is skipped entirely on touch and coarse-pointer devices.
- With `prefers-reduced-motion: reduce` the roaming spin stops; the brackets still snap to targets.
- Labels come from `data-cursor-label` and are decorative; keep real accessible names (`aria-label`, text) on the targets themselves.

- Ported from [React Bits](https://reactbits.dev/animations/target-cursor) by David Haz.
