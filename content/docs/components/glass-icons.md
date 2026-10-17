---
title: Glass Icons
description: Liquid glass icons that bend the color behind them, for app grids, docks and social links.
---

Each icon is a pane of glass over a colored card. A WebGL2 shader refracts the card through the curved glass edge, with optional rainbow dispersion, frost and a pointer-tracked highlight. The icons settle in with a staggered entrance the first time they scroll into view. Hover to lift, float or press the glass; move the pointer to drift the card behind it.

::demo-glass-icons
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glass-icons.json"
```

## Usage

```vue
<script setup lang="ts">
  import GlassIcons from '~/components/ui/glass-icons/GlassIcons.vue';
  import type { GlassIconsItem } from '~/components/ui/glass-icons/types';

  const items: GlassIconsItem[] = [
    { icon: 'lucide:folder', color: 'blue', label: 'Files' },
    { icon: 'lucide:book', color: 'purple', label: 'Books' },
    { icon: 'lucide:heart', color: 'red', label: 'Health' },
    { icon: 'lucide:cloud', color: 'indigo', label: 'Weather' },
    { icon: 'lucide:sticky-note', color: 'orange', label: 'Notes' },
    {
      icon: 'lucide:github',
      color: 'linear-gradient(135deg, #4a4752, #1d1b22)',
      label: 'GitHub',
      href: 'https://github.com',
      target: '_blank',
    },
  ];
</script>

<template>
  <GlassIcons :items="items" plate="tilt" hover="press" labels="hover" />
</template>
```

Without WebGL2 the component falls back to CSS: plain colored cards behind a `backdrop-filter` blur, with baked shine and shade maps. With `plate="none"` in Chromium, clear glass refracts the real page behind it through an SVG displacement filter.

## Props

| Prop           | Type                                       | Default     | Description                                                                                         |
| -------------- | ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------- |
| `items`        | `GlassIconsItem[]`                         | `[]`        | Icons to show (see below).                                                                          |
| `size`         | `number`                                   | `82`        | Width and height of each icon in px.                                                                |
| `gap`          | `number`                                   | `66`        | Space between the icons in px.                                                                      |
| `columns`      | `number`                                   | `3`         | Icons per row. They wrap to fewer columns when there is not enough room.                            |
| `roundness`    | `number`                                   | `0.6`       | Corner rounding, from 0 for square to 1 for a circle.                                               |
| `refraction`   | `number`                                   | `0.8`       | How strongly the glass bends what is behind it around its edge (0–1.5).                             |
| `bevel`        | `number`                                   | `0.6`       | Width of the curved glass edge, from 0 to 1.                                                        |
| `dispersion`   | `number`                                   | `0`         | Rainbow fringing where the edge bends the light, from 0 to 1.                                       |
| `frost`        | `number`                                   | `0.2`       | How much the glass blurs what is behind it, from 0 to 1.                                            |
| `shine`        | `number`                                   | `0.85`      | Strength of the light catching the glass edge, from 0 to 1.                                         |
| `tint`         | `string`                                   | `'#dfdfdf'` | Color of the glass.                                                                                 |
| `tint-opacity` | `number`                                   | `0.2`       | How strongly the tint colors the glass, from 0 to 1.                                                |
| `icon-color`   | `string`                                   | —           | Icon color. Defaults to white, or near black on clear glass in the light theme.                     |
| `plate`        | `'tilt' \| 'offset' \| 'circle' \| 'none'` | `'tilt'`    | Colored shape behind the glass: a tilted card, a shifted card, a disc or nothing for clear glass.   |
| `tilt`         | `number`                                   | `30`        | Angle of the tilted card in degrees.                                                                |
| `spread`       | `number`                                   | `0.5`       | How far the shifted card or disc peeks out from behind the glass, from 0 to 1.                      |
| `hover`        | `'lift' \| 'float' \| 'press' \| 'none'`   | `'press'`   | Hover animation. Lift raises the glass and swings the card, float raises it, press pushes it in.    |
| `parallax`     | `number`                                   | `1`         | How far the card behind the glass drifts with the pointer, from 0 to 1.                             |
| `labels`       | `'hover' \| 'always' \| 'none'`            | `'hover'`   | When the labels under the icons are shown.                                                          |
| `intro`        | `boolean`                                  | `true`      | Plays an entrance the first time the icons scroll into view: the glass settles and the cards swing. |
| `theme`        | `'dark' \| 'light'`                        | `'dark'`    | Color scheme of the labels and glass edges.                                                         |
| `class`        | `string`                                   | `''`        | Extra classes for the container.                                                                    |

### GlassIconsItem

| Field       | Type                          | Description                                                                                                                |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `icon`      | `string`                      | Iconify icon name, e.g. `'lucide:folder'`. Use the `icon` slot for custom markup.                                          |
| `label`     | `string`                      | Accessible name and the label under the icon.                                                                              |
| `color`     | `string`                      | Preset (`blue`, `purple`, `red`, `indigo`, `orange`, `green`, `teal`, `pink`, `graphite`, `silver`) or any color/gradient. |
| `href`      | `string`                      | Renders the icon as a link instead of a button.                                                                            |
| `target`    | `string`                      | Link target. `_blank` adds `rel="noreferrer"`.                                                                             |
| `onClick`   | `(event: MouseEvent) => void` | Click handler.                                                                                                             |
| `id`        | `string \| number`            | Stable key.                                                                                                                |
| `className` | `string`                      | Extra classes for the icon.                                                                                                |

## Slots

| Slot   | Props             | Description                                       |
| ------ | ----------------- | ------------------------------------------------- |
| `icon` | `{ item, index }` | Replaces the Iconify glyph with your own content. |

## Accessibility

- Each icon is a real `<button>` (or `<a>` with `href`) named by its `label`.
- Keyboard focus shows a ring around the glass and reveals the hover label; focus also plays the hover pose.
- With `prefers-reduced-motion: reduce` the entrance and springs jump straight to their end state.

- Ported from [React Bits](https://reactbits.dev/components/glass-icons) by David Haz.
