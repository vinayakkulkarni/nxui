---
title: Echo Text
description: Ghosted copies trail behind the text and settle into a single word — cursor-driven, auto-drifting or scroll-driven trails with click bursts.
---

A stack of tinted, blurred copies sits behind the text. On entrance they slide in and collapse into one word. Move the cursor and the text leans toward it while the echoes lag behind; click the text to send out a burst of expanding echoes. The trail can also drift on its own or stretch behind page scrolling.

::demo-echo-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/echo-text.json"
```

## Usage

```vue
<script setup lang="ts">
  import EchoText from '~/components/ui/echo-text/EchoText.vue';
</script>

<template>
  <EchoText
    text="Motion Echo"
    :echoes="12"
    :lag="0.24"
    :offset="36"
    direction="right"
    :echo-colors="['currentColor', '#ff7a45']"
    trail="auto"
    :click-burst="true"
  />
</template>
```

## Props

| Prop            | Type                                                  | Default                    | Description                                                                                                         |
| --------------- | ----------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `text`          | `string`                                              | `'Motion Echo'`            | Text rendered by the crisp front copy and every echo                                                                |
| `echoes`        | `number`                                              | `12`                       | Number of ghost copies behind the front text, up to 24                                                              |
| `lag`           | `number`                                              | `0.24`                     | How slowly deeper echoes catch up, and how far apart they spread along the auto trail                               |
| `offset`        | `number`                                              | `36`                       | Entrance spread, cursor lean, drift and click-burst reach, in px                                                    |
| `direction`     | `'right' \| 'left' \| 'up' \| 'down' \| 'diagonal'`   | `'right'`                  | Direction the entrance trail settles in from                                                                        |
| `fade`          | `number`                                              | `0.72`                     | How much of its opacity each echo keeps from the one in front of it                                                 |
| `blur`          | `number`                                              | `3`                        | Blur on the deepest echo, in px. Echoes in between blur less                                                        |
| `tint`          | `string \| false`                                     | `'#7dd3fc'`                | Color blended into the echoes, stronger toward the back. `false` for plain echoes                                   |
| `echo-colors`   | `[string, string]`                                    | `undefined`                | Two colors the echoes fade between, nearest to deepest. Replaces the tint when set                                  |
| `echo-style`    | `'solid' \| 'outline'`                                | `'solid'`                  | Draws the echoes as filled text or thin outlines                                                                    |
| `echo-scale`    | `number`                                              | `1`                        | Size of the deepest echo relative to the text. Below 1 the trail recedes, above 1 it looms                          |
| `mode`          | `'entrance' \| 'pointer' \| 'both'`                   | `'both'`                   | Whether the echoes play on entrance, run the live trail, or both. `pointer` means trail only, whatever drives it    |
| `trail`         | `'pointer' \| 'auto' \| 'scroll'`                     | `'pointer'`                | What drives the live trail: the cursor, a slow figure-eight drift while the cursor is away, or page scrolling       |
| `click-burst`   | `boolean`                                             | `true`                     | Clicking the text releases echoes that expand from the click point and fade                                         |
| `cursor-radius` | `number`                                              | `320`                      | Distance in px over which the cursor pulls the text to full offset. With `trail="auto"` the drift resumes beyond it |
| `duration`      | `number`                                              | `900`                      | How long the entrance takes to settle, in ms                                                                        |
| `ease`          | `'linear' \| 'ease-out' \| 'ease-in-out' \| 'snappy'` | `'ease-out'`               | Timing curve of the entrance                                                                                        |
| `font-size`     | `string \| number`                                    | `'clamp(3rem, 9vw, 7rem)'` | Font size of the text (numbers are px)                                                                              |
| `font-weight`   | `string \| number`                                    | `800`                      | Font weight of the text                                                                                             |
| `color`         | `string`                                              | `'currentColor'`           | Color of the front copy. Follows the surrounding text color by default                                              |
| `class`         | `string`                                              | `''`                       | Extra classes on the root element                                                                                   |

## Accessibility

- Only the front copy is exposed to assistive technology; every echo and burst copy is `aria-hidden`.
- With `prefers-reduced-motion: reduce` no echoes render and the text stays still.
- The cursor follow only runs on devices with a fine, hovering pointer.

- Ported from [React Bits](https://reactbits.dev/text-animations/echo-text) by David Haz.
