---
title: Magic Bento
description: A bento grid of feature cards with live artwork, edge light that follows the cursor and a click wave across the grid.
---

Six feature cards with animated artwork rise in when the grid scrolls into view. Move the cursor over the grid to light up the card edges and the hovered card; scrub the analytics chart; click a card to send a ring of light across the grid and replay its artwork.

::demo-magic-bento
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magic-bento.json"
```

## Usage

```vue
<script setup lang="ts">
  import { MagicBento } from '~/components/ui/magic-bento';
  import type { MagicBentoItem } from '~/components/ui/magic-bento';

  const items: MagicBentoItem[] = [
    {
      label: 'Insights',
      title: 'Analytics',
      icon: 'lucide:chart-line',
      visual: 'analytics',
    },
    {
      title: 'The Pier',
      description: 'Dusk',
      image: '/pier.webp',
      colSpan: 2,
      rowSpan: 2,
    },
    { title: 'Uptime', description: 'Last 90 days', visual: 'uptime' },
    { title: 'Docs', description: 'Read the guide', href: '/docs' },
  ];

  function onItemClick(item: MagicBentoItem, index: number) {
    console.log(item.title, index);
  }
</script>

<template>
  <MagicBento
    :items="items"
    theme="dark"
    glow-color="#38bdf8"
    enable-stars
    @item-click="onItemClick"
  >
    <!-- Custom artwork for any item whose `visual` is not a built-in name -->
    <template #uptime>
      <div class="h-full rounded-lg bg-emerald-500/20" />
    </template>
  </MagicBento>
</template>
```

Built-in artwork: `analytics` (scrubbable line chart), `dashboard` (bar chart), `collaboration` (live document with two cursors), `automation` (CI pipeline that runs when you hover), `integration` (app hub with packets) and `security` (SSO / 2FA switches).

## Props

| Prop                 | Type                | Default           | Description                                                                      |
| -------------------- | ------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `items`              | `MagicBentoItem[]`  | Six feature cards | Cards to show                                                                    |
| `columns`            | `number`            | `4`               | Columns on wide screens. Drops to 2, then 1, as the grid gets narrower           |
| `row-height`         | `number`            | `200`             | Height of one row, in px                                                         |
| `gap`                | `number`            | `12`              | Space between cards, in px                                                       |
| `radius`             | `number`            | `20`              | Corner radius of the cards, in px                                                |
| `theme`              | `'dark' \| 'light'` | `'dark'`          | Color theme of the cards                                                         |
| `glow-color`         | `string`            | Text color        | Color of the lights and the accents in the artwork. Hex or `r, g, b`             |
| `enable-border-glow` | `boolean`           | `true`            | Lights up the card edges near the cursor, across neighboring cards too           |
| `enable-spotlight`   | `boolean`           | `true`            | A soft light follows the cursor inside the hovered card                          |
| `spotlight-radius`   | `number`            | `300`             | Size of the cursor light, in px                                                  |
| `enable-stars`       | `boolean`           | `false`           | Fine specks of light drift up around the cursor in the hovered card              |
| `particle-count`     | `number`            | `24`              | Number of specks in each card                                                    |
| `enable-tilt`        | `boolean`           | `false`           | Tilts the hovered card toward the cursor                                         |
| `enable-magnetism`   | `boolean`           | `false`           | The hovered card leans a few pixels toward the cursor                            |
| `click-effect`       | `boolean`           | `true`            | Clicking sends a ring of light across the grid and replays the card artwork      |
| `text-auto-hide`     | `boolean`           | `true`            | Keeps titles to one line and descriptions to two                                 |
| `intro`              | `boolean`           | `true`            | Cards rise in one by one and their artwork plays when the grid scrolls into view |
| `disable-animations` | `boolean`           | `false`           | Turns off all motion. Reduced motion settings do the same                        |
| `class`              | `string`            | `''`              | Extra classes for the grid                                                       |

## Item fields

| Field                   | Type                          | Description                                                                            |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `id`                    | `string \| number`            | Stable key                                                                             |
| `label`                 | `string`                      | Small caption next to the icon                                                         |
| `icon`                  | `string`                      | Iconify name, e.g. `lucide:chart-line`                                                 |
| `title`, `description`  | `string`                      | Card text                                                                              |
| `image`                 | `string`                      | Photo that fills the card, with a soft shade under the text                            |
| `visual`                | `MagicBentoVisual \| string`  | A built-in artwork name, or the name of a slot you pass (scoped `{ item, index }`)     |
| `content`               | `string`                      | Name of a slot that replaces the whole inside of the card. Lights and wave still apply |
| `href`, `target`, `rel` | `string`                      | Renders the card as a link                                                             |
| `onClick`               | `(event: MouseEvent) => void` | Click handler for this card                                                            |
| `colSpan`, `rowSpan`    | `number`                      | Cells the card covers                                                                  |

## Events

| Event        | Payload                                 | Description                                                           |
| ------------ | --------------------------------------- | --------------------------------------------------------------------- |
| `item-click` | `(item: MagicBentoItem, index: number)` | Fired when a card is clicked. Listening makes cards focusable buttons |

## Accessibility

- Cards with `href` render as links; cards with `onClick` or an `item-click` listener become `role="button"` with `tabindex="0"` and respond to Enter and Space. Keyboard activation starts the wave from the card center.
- Focused cards show a visible ring.
- The artwork is decorative and marked `aria-hidden`.
- `prefers-reduced-motion: reduce` turns off the intro, artwork animation, tilt, magnetism, stars and the click wave, as `disable-animations` does.

- Ported from [React Bits](https://reactbits.dev/components/magic-bento) by David Haz.
