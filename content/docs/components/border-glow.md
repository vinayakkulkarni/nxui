---
title: Border Glow
description: Card with a mesh-gradient border and outer glow that follow the cursor direction and grow stronger near the edges.
---

A card whose border lights up with a coloured mesh gradient and a soft outer glow. Move the pointer toward an edge and the light points at the cursor, getting stronger the closer you get. Light background colours switch to a light-surface border and shadow automatically.

::demo-border-glow
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/border-glow.json"
```

## Usage

```vue
<script setup lang="ts">
  import BorderGlow from '~/components/ui/border-glow/BorderGlow.vue';
</script>

<template>
  <BorderGlow
    glow-color="40 80 80"
    background-color="#120F17"
    :colors="['#c084fc', '#f472b6', '#38bdf8']"
  >
    <div class="p-8">
      <h3 class="text-xl font-semibold">Hover Near the Edges</h3>
      <p class="text-sm opacity-70">
        Move your cursor close to the card border.
      </p>
    </div>
  </BorderGlow>
</template>
```

## Props

| Prop               | Type       | Default                             | Description                                                               |
| ------------------ | ---------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `edge-sensitivity` | `number`   | `30`                                | How close the pointer must be to the edge for the glow to appear (0-100). |
| `glow-color`       | `string`   | `'40 80 80'`                        | HSL values for the glow colour, as `"H S L"`.                             |
| `background-color` | `string`   | `'#120F17'`                         | Background colour of the card. Light colours use a light-surface style.   |
| `border-radius`    | `number`   | `28`                                | Corner radius of the card in px.                                          |
| `glow-radius`      | `number`   | `40`                                | How far the outer glow extends beyond the card in px.                     |
| `glow-intensity`   | `number`   | `1`                                 | Multiplier for glow opacity (0.1-3.0).                                    |
| `cone-spread`      | `number`   | `25`                                | Width of the directional cone mask as a percentage (5-45).                |
| `animated`         | `boolean`  | `false`                             | Play an intro sweep around the border on mount.                           |
| `colors`           | `string[]` | `['#c084fc', '#f472b6', '#38bdf8']` | Three colours for the mesh-gradient border.                               |
| `fill-opacity`     | `number`   | `0.5`                               | Opacity of the coloured fill near the edges.                              |
| `class`            | `string`   | —                                   | Extra classes for the card.                                               |

## Slots

| Slot      | Description                       |
| --------- | --------------------------------- |
| `default` | Content rendered inside the card. |

## Accessibility

- The glow layers are decorative pseudo-elements and an empty span, so screen readers only see your content.
- The intro sweep does not play when the user prefers reduced motion.

- Ported from [React Bits](https://reactbits.dev/components/border-glow) by David Haz.
