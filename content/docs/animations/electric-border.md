---
title: Electric Border
description: Wraps any element in crackling strands of current that surge near the cursor and leap off in sparks.
---

Wraps any element in layered strands of lightning with sparks and a soft glow. The current races around the edge from the top as it powers on, surges near the cursor, and a click sends a jolt racing around the border. Toggle `active` to power it on and off; in the composer demo the stop button does exactly that.

::demo-electric-border
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/electric-border.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import ElectricBorder from '~/components/ui/electric-border/ElectricBorder.vue';

  const generating = ref(true);
  const colorMode = useColorMode();
</script>

<template>
  <ElectricBorder
    color="#7df9ff"
    :border-radius="24"
    :active="generating"
    :theme="colorMode.value === 'light' ? 'light' : 'dark'"
    class="w-full max-w-130"
  >
    <div class="rounded-3xl bg-card p-4">
      Write a launch post for our new electric borders.
      <button type="button" @click="generating = !generating">Stop</button>
    </div>
  </ElectricBorder>
</template>
```

The border is drawn on a WebGL canvas that extends 64px beyond the wrapper, so leave some room around it (or let the parent clip it). Match `border-radius` to the content's own radius.

## Props

| Prop            | Type                | Default     | Description                                                                                   |
| --------------- | ------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `color`         | `string`            | `'#7df9ff'` | Color of the current. The strands burn whiter at their core.                                  |
| `glow-color`    | `string`            | —           | Color of the glow around the strands. Defaults to `color`.                                    |
| `speed`         | `number`            | `1`         | How fast the current crackles and moves.                                                      |
| `chaos`         | `number`            | `0.5`       | How jagged the strands are, from 0 to 2.                                                      |
| `spread`        | `number`            | `0.6`       | How far the strands wander from the edge, from 0 to 2.                                        |
| `thickness`     | `number`            | `1.5`       | Thickness of the strands, in px.                                                              |
| `strands`       | `number`            | `3`         | Number of strands running along the edge, from 1 to 6.                                        |
| `glow`          | `number`            | `0.6`       | Strength of the glow around the border.                                                       |
| `intensity`     | `number`            | `0.8`       | Overall brightness of the current.                                                            |
| `arcs`          | `number`            | `1`         | How often sparks leap off the border. `0` turns them off.                                     |
| `flicker`       | `number`            | `0.5`       | How much the current flickers, from 0 to 1.                                                   |
| `border-radius` | `number`            | `24`        | Corner radius of the border, in px. Match it to your content.                                 |
| `offset`        | `number`            | `0`         | Moves the border outward from the edge of the content, in px. Negative values move it inward. |
| `active`        | `boolean`           | `true`      | Powers the border on or off. Turning it on sends the current racing around the edge again.    |
| `intro`         | `boolean`           | `true`      | The current races around the edge from the top when the border mounts.                        |
| `interactive`   | `boolean`           | `true`      | The current surges near the cursor and clicks send a jolt around the edge.                    |
| `cursor-radius` | `number`            | `90`        | Size of the area around the cursor where the current surges, in px.                           |
| `theme`         | `'dark' \| 'light'` | `'dark'`    | Glowing light for dark pages, or crisp ink with a white core for light ones.                  |
| `class`         | `string`            | `''`        | Extra classes for the wrapper.                                                                |

## Slots

| Slot      | Description                    |
| --------- | ------------------------------ |
| `default` | Content wrapped by the border. |

## Accessibility

- The canvas is `aria-hidden` and ignores pointer events, so the wrapped content keeps its own focus order and hit targets.
- With `prefers-reduced-motion: reduce`, the current moves at a fifth of the speed, flicker, sparks and click jolts are off, and the power-on race is skipped.
- Rendering stops when the border is off-screen, the tab is hidden, or the border is powered down.

- Ported from [React Bits](https://reactbits.dev/animations/electric-border) by David Haz.
