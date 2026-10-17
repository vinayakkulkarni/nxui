---
title: Bell Toggle
description: Pill toggle where a press rings the bell, crossfades the label and unfurls the pill.
---

A subscribe toggle. Click it and the pill inverts, the label crossfades and the width springs to the new label while the bell rings with a decaying swing and sound waves. When the `count` grows while it is on, a badge pops in and the bell gives a short wobble. Keyboard toggles switch state without the ring.

::demo-bell-toggle
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bell-toggle.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import BellToggle from '~/components/ui/bell-toggle/BellToggle.vue';

  const subscribed = ref(false);
  const unread = ref(0);
</script>

<template>
  <BellToggle
    v-model:pressed="subscribed"
    off-label="Notify me"
    on-label="You'll be notified"
    :count="unread"
    :ring-amplitude="17"
    :ring-passes="5"
  />
</template>
```

The ring is a Web Animations API keyframe track. Each pass swings the other way with a smaller angle (`ring-decay` shapes the falloff), and the passes bunch up toward the end like a real bell settling. A new ring starts from the bell's current angle, so rapid toggles never snap. The width change is a `clip-path` inset driven by one spring, so the text never reflows.

## Props

| Prop               | Type                   | Default                | Description                                                              |
| ------------------ | ---------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `off-label`        | `string`               | `'Notify me'`          | Label while off.                                                         |
| `on-label`         | `string`               | `"You'll be notified"` | Label while on.                                                          |
| `icon`             | `string`               | `'lucide:bell'`        | Iconify name of the bell glyph. The `icon` slot overrides it.            |
| `label`            | `string`               | `off-label`            | Accessible name of the button.                                           |
| `color`            | `string`               | `'#f5f5f5'`            | Text and icon color while off.                                           |
| `background`       | `string`               | `'#27272a'`            | Pill color while off.                                                    |
| `on-color`         | `string`               | `'#18181b'`            | Text and icon color while on.                                            |
| `on-background`    | `string`               | `'#f5f5f5'`            | Pill color while on.                                                     |
| `size`             | `'sm' \| 'md' \| 'lg'` | `'md'`                 | Pill height 36, 44 or 52 px; font, icon and padding follow.              |
| `radius`           | `number`               | `22`                   | Corner radius in px.                                                     |
| `ring-amplitude`   | `number`               | `17`                   | First swing angle in degrees.                                            |
| `ring-passes`      | `number`               | `5`                    | Number of swings.                                                        |
| `ring-decay`       | `number`               | `1`                    | How fast the swings shrink. Higher dies out faster.                      |
| `ring-duration`    | `number`               | `820`                  | Ring length in ms.                                                       |
| `ring-pivot`       | `number`               | `16`                   | Hinge height as a percent of the icon, from the top.                     |
| `crossfade-ms`     | `number`               | `200`                  | Label crossfade and color transition in ms.                              |
| `reveal-bounce`    | `number`               | `0`                    | Bounce of the width spring.                                              |
| `count`            | `number`               | `0`                    | Unread count. Shown in the badge while on; an increase wobbles the bell. |
| `badge`            | `boolean`              | `true`                 | Show the count badge.                                                    |
| `badge-color`      | `string`               | `'#ef4444'`            | Badge background.                                                        |
| `badge-text-color` | `string`               | `'#ffffff'`            | Badge digit color.                                                       |
| `waves`            | `boolean`              | `true`                 | Sound waves that pulse on each swing.                                    |
| `clapper`          | `boolean`              | `false`                | Draw a bell with a separate clapper that swings a little behind.         |
| `pressed`          | `boolean`              | `undefined`            | Controlled state (`v-model:pressed`).                                    |
| `default-pressed`  | `boolean`              | `false`                | Initial state when uncontrolled.                                         |
| `disabled`         | `boolean`              | `false`                | Dims the pill and ignores input. The state is kept.                      |
| `class`            | `string`               | `''`                   | Extra classes for the root.                                              |

## Events

| Event            | Payload              | Description           |
| ---------------- | -------------------- | --------------------- |
| `update:pressed` | `(pressed: boolean)` | The pill was toggled. |
| `change`         | `(pressed: boolean)` | Same moment.          |

## Slots

| Slot   | Description                                                        |
| ------ | ------------------------------------------------------------------ |
| `icon` | Custom glyph that rings in place of the bell (not with `clapper`). |

## Accessibility

- A native `button` with `aria-pressed`. Its accessible name is `label`, or `off-label` if not set.
- Space and Enter toggle it. Keyboard toggles skip the ring and the width spring.
- Focus shows an inset ring.
- With `prefers-reduced-motion: reduce`, the bell does not ring, the width jumps and the label does not blur.

- Ported from [React Bits](https://reactbits.dev/micro/bell-toggle) by David Haz.
