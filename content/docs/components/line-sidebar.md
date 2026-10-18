---
title: Line Sidebar
description: List navigation with a rail of markers; items near the cursor shift, tint and grow their markers, and the clicked item stays lit.
---

A vertical menu beside a rail of marker lines. Move the cursor along the list and the nearest items slide right, blend toward the accent color and stretch their markers, fading off with distance. Click an item to pin it. Tune the reach, shift and falloff curve in the panel.

::demo-line-sidebar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/line-sidebar.json"
```

## Usage

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import LineSidebar from '~/components/ui/line-sidebar/LineSidebar.vue';

  const active = ref<number | null>(null);

  function onItemClick(index: number, label: string) {
    console.log(index, label);
  }
</script>

<template>
  <LineSidebar
    v-model="active"
    :items="['Overview', 'Components', 'Animations', 'Backgrounds']"
    accent-color="#A855F7"
    :proximity-radius="100"
    :max-shift="30"
    falloff="smooth"
    @item-click="onItemClick"
  />
</template>
```

Every item exposes a single `--effect` custom property (0–1) eased by one
frame-rate-independent rAF loop — label color, horizontal shift, index
opacity and marker scale all read it, so nothing staggers. The clicked
item pins to full effect until another is chosen.

## Props

| Prop               | Type                              | Default     | Description                                             |
| ------------------ | --------------------------------- | ----------- | ------------------------------------------------------- |
| `items`            | `string[]`                        | 12 samples  | Menu labels                                             |
| `accent-color`     | `string`                          | `'#A855F7'` | Proximity/active tint                                   |
| `text-color`       | `string`                          | `'#c4c4c4'` | Resting label color                                     |
| `marker-color`     | `string`                          | `'#6c6c6c'` | Resting marker color                                    |
| `show-index`       | `boolean`                         | `true`      | Show 01/02/… prefixes                                   |
| `show-marker`      | `boolean`                         | `true`      | Show the marker rail                                    |
| `proximity-radius` | `number`                          | `100`       | Cursor influence radius (px)                            |
| `max-shift`        | `number`                          | `30`        | Max label shift (px)                                    |
| `falloff`          | `'linear' \| 'smooth' \| 'sharp'` | `'smooth'`  | Proximity falloff curve                                 |
| `marker-length`    | `number`                          | `60`        | Marker line length (px)                                 |
| `marker-gap`       | `number`                          | `0`         | Gap between marker and label (px)                       |
| `tick-scale`       | `number`                          | `0.5`       | In-between tick length ratio                            |
| `scale-tick`       | `boolean`                         | `true`      | Ticks also grow with proximity                          |
| `item-gap`         | `number`                          | `20`        | Vertical gap between items (px)                         |
| `font-size`        | `number`                          | `1.1`       | Label size (rem)                                        |
| `smoothing`        | `number`                          | `100`       | Easing time constant (ms)                               |
| `default-active`   | `number \| null`                  | `null`      | Item active on first render when `v-model` is not bound |
| `class`            | `string`                          | `''`        | Extra classes on the root                               |

## v-model / Events

| API          | Type                             | Description         |
| ------------ | -------------------------------- | ------------------- |
| `modelValue` | `number \| null`                 | Active item index   |
| `item-click` | `(index: number, label: string)` | Fired on item click |

## Accessibility

- The root is a `<nav>` landmark; the active item carries `aria-current="true"`.
- Items are list entries, not links. Wrap the labels in links or buttons in your own fork if they must be reachable by keyboard.
- The effect runs on one rAF loop that stops as soon as every item settles.

- Ported from [React Bits](https://reactbits.dev/components/line-sidebar) by David Haz.
