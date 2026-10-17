---
title: Chroma Grid
description: A grid of grayscale photo cards where a spotlight follows the cursor and brings back color.
---

A responsive grid of photo cards drained to grayscale. Move the cursor across it and a soft spotlight trails behind, bringing back each photo's color, washing the card in its accent and lighting up the border nearest the cursor. Move off and the color fades back. Switch `reveal` to `card` to color one whole card on hover instead. Try the presets in the panel.

::demo-chroma-grid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/chroma-grid.json"
```

## Usage

```vue
<script setup lang="ts">
  import ChromaGrid from '~/components/ui/chroma-grid/ChromaGrid.vue';
  import type { ChromaGridItem } from '~/components/ui/chroma-grid/types';

  const items: ChromaGridItem[] = [
    {
      image: '/photos/field.webp',
      title: 'Canola Field',
      subtitle: 'Midday',
      accent: '#ffd23f',
    },
    {
      image: '/photos/pier.webp',
      title: 'The Pier',
      subtitle: 'Clear sky',
      accent: '#3fb8ff',
      url: 'https://example.com',
    },
    {
      image: '/photos/sky.webp',
      title: 'Open Sky',
      subtitle: 'Golden hour',
      accent: '#ff9a4c',
    },
  ];
</script>

<template>
  <ChromaGrid
    :items="items"
    :columns="3"
    :radius="260"
    reveal="spotlight"
    theme="dark"
  />
</template>
```

The spotlight is one radial mask shared by every card: each card stores its offset in the grid, so the mask lines up across card gaps. A single rAF loop eases the cursor position and the reveal strength, then stops once both settle.

## Props

| Prop             | Type                    | Default         | Description                                                                       |
| ---------------- | ----------------------- | --------------- | --------------------------------------------------------------------------------- |
| `items`          | `ChromaGridItem[]`      | 6 sample photos | The cards to show. With a `url` the whole card becomes a link                     |
| `columns`        | `number`                | `3`             | The most columns the grid shows                                                   |
| `min-card-width` | `number`                | `180`           | Narrowest a card can get, in px. The grid drops columns to keep cards this wide   |
| `gap`            | `number`                | `12`            | Space between cards, in px                                                        |
| `radius`         | `number`                | `260`           | Size of the color spotlight, in px                                                |
| `softness`       | `number`                | `0.6`           | How gradually the spotlight fades at its edge, 0 crisp – 1 soft glow              |
| `damping`        | `number`                | `0.45`          | How smoothly the spotlight trails the cursor. `0` follows it exactly              |
| `fade-out`       | `number`                | `0.6`           | How long the colors take to fade back to gray after the cursor leaves, in seconds |
| `grayscale`      | `number`                | `1`             | How much color is drained outside the spotlight, 0–1                              |
| `dim`            | `number`                | `0.12`          | How much images darken outside the spotlight                                      |
| `glow`           | `number`                | `0.5`           | Strength of each card's accent glowing up from the bottom as it is revealed       |
| `border-glow`    | `number`                | `1`             | Strength of each card's border lighting up in its accent near the cursor          |
| `reveal`         | `'spotlight' \| 'card'` | `'spotlight'`   | Reveal color in a spotlight that follows the cursor, or one whole card on hover   |
| `aspect-ratio`   | `string`                | `'3 / 2'`       | Aspect ratio of the images, as a CSS `aspect-ratio` value                         |
| `card-radius`    | `number`                | `22`            | Corner radius of the cards, in px                                                 |
| `show-info`      | `boolean`               | `true`          | Shows the title and subtitle under each image                                     |
| `frame`          | `boolean`               | `false`         | Wraps the grid in a frosted glass panel                                           |
| `theme`          | `'dark' \| 'light'`     | `'dark'`        | Color theme of the cards                                                          |
| `class`          | `string`                | `''`            | Extra classes on the grid                                                         |

### ChromaGridItem

| Field         | Type     | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `image`       | `string` | Image URL                                          |
| `title`       | `string` | Title under the image, also the default alt text   |
| `subtitle`    | `string` | Second line under the title                        |
| `accent`      | `string` | Color of the glow and the lit border               |
| `borderColor` | `string` | Fallback for `accent`                              |
| `alt`         | `string` | Alt text for the image                             |
| `url`         | `string` | Turns the card into a link that opens in a new tab |

## Accessibility

- Cards without a `url` are `<article>` elements; with a `url` they are links with a visible focus ring and `rel="noopener noreferrer"`.
- The colored copy of each image is `aria-hidden`, so screen readers announce each photo once, using `alt` or the title.
- With `prefers-reduced-motion: reduce` the spotlight jumps to the cursor and the color appears without easing.

- Ported from [React Bits](https://reactbits.dev/components/chroma-grid) by David Haz.
