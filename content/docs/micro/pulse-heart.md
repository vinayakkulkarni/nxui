---
title: Pulse Heart
description: Like button that contracts to a dot, flips colour and pulses back as the count ticks over.
---

A like button with a heartbeat. Click it and the glyph contracts to a dot, flips to the liked colour at its smallest point, then swells back past full size with a back-ease while the pill beats and the changed digit of the count rolls over. Click again to unlike. Keyboard presses switch instantly.

::demo-pulse-heart
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pulse-heart.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import PulseHeart from '~/components/ui/pulse-heart/PulseHeart.vue';

  const liked = ref(false);
</script>

<template>
  <PulseHeart v-model:liked="liked" :count="1204" liked-color="#ff4d6d" />
</template>
```

## Props

| Prop            | Type                           | Default     | Description                                              |
| --------------- | ------------------------------ | ----------- | -------------------------------------------------------- |
| `liked`         | `boolean`                      | `undefined` | Controlled state (`v-model:liked`). Unset = uncontrolled |
| `default-liked` | `boolean`                      | `false`     | Initial state when uncontrolled                          |
| `count`         | `number`                       | `0`         | The number shown; a press adds or removes one            |
| `show-count`    | `boolean`                      | `true`      | Show the count beside the glyph                          |
| `icon`          | `'heart' \| 'star' \| 'thumb'` | `'heart'`   | Built-in glyph (or use the `icon` slot)                  |
| `idle-outline`  | `boolean`                      | `true`      | Idle glyph is an outline; `false` makes it solid         |
| `size`          | `number`                       | `40`        | Glyph size in px; the pill and text scale with it        |
| `corner`        | `number`                       | `32`        | Pill corner radius in px                                 |
| `liked-color`   | `string`                       | `'#ff4d6d'` | Glyph colour when liked                                  |
| `idle-color`    | `string`                       | `'#8b8b93'` | Glyph colour when idle                                   |
| `pill-color`    | `string`                       | `'#232326'` | Pill background                                          |
| `text-color`    | `string`                       | `'#f5f5f5'` | Count colour                                             |
| `duration`      | `number`                       | `560`       | The whole pulse, in ms                                   |
| `dot-size`      | `number`                       | `0.3`       | How small the glyph contracts, as a fraction of its size |
| `overshoot`     | `number`                       | `1.7`       | Back-ease overshoot of the swell                         |
| `beat`          | `number`                       | `3`         | How much the pill contracts with the beat, in percent    |
| `roll-duration` | `number`                       | `350`       | Count roll duration, in ms                               |
| `disabled`      | `boolean`                      | `false`     | Disables the button                                      |
| `label`         | `string`                       | `'Like'`    | Accessible name                                          |
| `class`         | `string`                       | `''`        | Extra classes for the button                             |

## Events

| Event          | Payload                           | Description                      |
| -------------- | --------------------------------- | -------------------------------- |
| `change`       | `(liked: boolean, count: number)` | Every press, with the next state |
| `update:liked` | `liked: boolean`                  | For `v-model:liked`              |

## Slots

| Slot   | Description                                            |
| ------ | ------------------------------------------------------ |
| `icon` | Custom glyph; it scales as a whole instead of the path |

## Accessibility

- Native `<button>` with `aria-pressed`; its accessible name is “Like, 1,204” (the visible count is `aria-hidden`).
- Keyboard activation and `prefers-reduced-motion` skip the pulse and switch state instantly.
- Focus ring uses the liked colour; on coarse pointers the hit area is at least 44×44px.

- Ported from [React Bits](https://reactbits.dev/micro/pulse-heart) by David Haz.
