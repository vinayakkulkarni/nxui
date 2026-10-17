---
title: Accordion Gallery
description: Image panels that expand on hover or focus, with 3D tilt, parallax imagery and a staggered caption.
---

A row of image panels. Hover, click or focus a panel to open it: it widens, turns to colour and shows its caption, while closed panels tilt away and their images shift toward it. Arrow keys move between panels.

::demo-accordion-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/accordion-gallery.json"
```

## Usage

```vue
<script setup lang="ts">
  import AccordionGallery from '~/components/ui/accordion-gallery/AccordionGallery.vue';
  import type { AccordionGalleryItem } from '~/components/ui/accordion-gallery/types';

  const items: AccordionGalleryItem[] = [
    {
      image: 'https://picsum.photos/id/1015/900/1200',
      label: 'Canyon',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1018/900/1200',
      label: 'Ridgeline',
      link: '#',
    },
    {
      image: 'https://picsum.photos/id/1039/900/1200',
      label: 'Falls',
      link: '#',
    },
  ];
</script>

<template>
  <AccordionGallery
    :items="items"
    :default-index="1"
    :height="460"
    ease="power3.out"
  />
</template>
```

## Props

| Prop            | Type                         | Default        | Description                                                                                                    |
| --------------- | ---------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `items`         | `AccordionGalleryItem[]`     | 5 demo panels  | `{ image, label?, link?, alt? }`. A `link` makes the panel a link.                                             |
| `default-index` | `number`                     | `2`            | Index of the panel that starts open.                                                                           |
| `accent-color`  | `string`                     | `'#ffffff'`    | Colour of the caption bar and focus ring.                                                                      |
| `overlay-color` | `string`                     | `'#060010'`    | Tint over closed panels and the caption gradient.                                                              |
| `text-color`    | `string`                     | `'#ffffff'`    | Caption text colour.                                                                                           |
| `height`        | `number`                     | `460`          | Height in pixels. Vertical orientation uses 1.6×.                                                              |
| `gap`           | `number`                     | `10`           | Space between panels in pixels.                                                                                |
| `radius`        | `number`                     | `16`           | Corner radius of each panel in pixels.                                                                         |
| `expand-ratio`  | `number`                     | `0.52`         | Share of the row the open panel takes (0.2–0.9).                                                               |
| `orientation`   | `'horizontal' \| 'vertical'` | `'horizontal'` | Lay panels out in a row or a column.                                                                           |
| `duration`      | `number`                     | `0.6`          | Transition length in seconds.                                                                                  |
| `ease`          | `string`                     | `'power3.out'` | GSAP-style ease name: `power1`–`power4` `.in/.out/.inOut`, `sine.*`, `expo.*`, `circ.out`, `back.out`, `none`. |
| `parallax`      | `number`                     | `0.5`          | How far closed images shift toward the open panel.                                                             |
| `tilt`          | `number`                     | `8`            | 3D tilt of closed panels in degrees.                                                                           |
| `stagger`       | `number`                     | `0.06`         | Delay between the caption bar and the caption text (s).                                                        |
| `trigger`       | `'hover' \| 'click'`         | `'hover'`      | Open a panel on hover or only on click.                                                                        |
| `show-labels`   | `boolean`                    | `true`         | Show the caption on the open panel.                                                                            |
| `grayscale`     | `boolean`                    | `true`         | Closed panels are grayscale; the open one is in colour.                                                        |

On screens up to 520px wide the panels stack in a column and the tilt is off.

## Accessibility

- The gallery is a `role="list"`; every panel is focusable, named by its label, and the open one has `aria-current="true"`.
- Focus opens a panel. Arrow keys move focus to the next or previous panel and open it.
- On a closed panel with a `link`, the first click only opens it; the second follows the link.
- With `prefers-reduced-motion: reduce` panels change without animation.

- Ported from [React Bits](https://reactbits.dev/components/accordion-gallery) by David Haz.
