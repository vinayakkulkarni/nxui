---
title: Newsletter Bookshelf
description: A WebGL newsletter archive of cloth-bound books. Browse the shelf sideways, lift a spine on hover, and pull a book forward to inspect its cover.
---

A three.js shelf that turns each newsletter edition into a cloth-bound book with a generated cover, spine and page block. Drag, scroll sideways or use the arrow keys to move along the shelf. Hover lifts a book and shows its title. Click a book to fly it forward and turn its cover to you; it sways on its own and you can drag to rotate it. Click it again to open its link, or press Escape to put it back.

::demo-newsletter-bookshelf
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/newsletter-bookshelf.json"
```

## Usage

```vue
<script setup lang="ts">
  import NewsletterBookshelf from '~/components/ui/newsletter-bookshelf/NewsletterBookshelf.vue';
  import type { NewsletterBookshelfItem } from '~/components/ui/newsletter-bookshelf/types';

  const editions: NewsletterBookshelfItem[] = [
    {
      id: 'edition-04',
      title: 'The useful systems issue',
      date: 'JUL 24, 2026',
      href: '/posts/useful-systems',
    },
    {
      id: 'edition-03',
      title: 'A better creative workflow',
      date: 'JUL 17, 2026',
      href: '/posts/creative-workflow',
    },
    {
      id: 'edition-02',
      title: 'Notes on building in public',
      date: 'JUL 10, 2026',
      color: '#efe8d4',
    },
    {
      id: 'edition-01',
      title: 'The small team advantage',
      date: 'JUL 3, 2026',
      color: '#16277a',
    },
  ];

  function onSelect(edition: NewsletterBookshelfItem, index: number) {
    console.log('Selected', edition.id, index);
  }
</script>

<template>
  <NewsletterBookshelf
    :items="editions"
    brand="Studio Notes"
    @select="onSelect"
  />
</template>
```

Each book's width, height, cloth colour and cover motif come from a seeded
hash of its `id`, so the shelf looks the same on every load. Covers, spines
and pages are drawn once into 2D canvases and used as three.js textures.

## Props

| Prop     | Type                        | Default         | Description                                                                         |
| -------- | --------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `items`  | `NewsletterBookshelfItem[]` | 32 sample books | Editions on the shelf. An empty array uses the samples.                             |
| `height` | `number \| string`          | `620`           | Height of the stage. A number is pixels; a string is any CSS length, e.g. `'100%'`. |
| `brand`  | `string`                    | `'The Brief'`   | Wordmark printed at the bottom of every generated cover.                            |
| `class`  | `string`                    | —               | Extra classes merged onto the root element.                                         |

### `NewsletterBookshelfItem`

| Field      | Type     | Description                                                                      |
| ---------- | -------- | -------------------------------------------------------------------------------- |
| `id`       | `string` | Stable id. It seeds the book's size, colour and motif.                           |
| `title`    | `string` | Printed on the cover and spine, and shown in the hover tooltip.                  |
| `date`     | `string` | Printed on the cover and shown in the hover tooltip.                             |
| `subtitle` | `string` | Optional description kept with the item.                                         |
| `href`     | `string` | Opened when a focused book is activated again. Only `http` and `https` are used. |
| `color`    | `string` | Cloth colour (hex). Defaults to a seeded pick from a blue and cream palette.     |
| `foil`     | `string` | Foil colour (hex). Defaults to cream on dark cloth and blue on light cloth.      |

## Events

| Event    | Payload                                          | Description                                |
| -------- | ------------------------------------------------ | ------------------------------------------ |
| `select` | `(item: NewsletterBookshelfItem, index: number)` | Fired when a book enters the focused view. |

## Accessibility

- The stage is a focusable `region` with a visible inset focus ring. Its label names the focused book or the edition count.
- Arrow keys move along the shelf. When a book is focused, they switch to the next or previous book.
- Enter or Space focuses the book nearest the centre, or opens the focused book's link. Escape puts the book back.
- With `prefers-reduced-motion: reduce`, books snap into place and the focused book does not sway.
- The render loop pauses while the shelf is offscreen. All textures, geometry and the WebGL context are freed on unmount.

- Ported from [componentry.fun](https://componentry.dev/docs/components/newsletter-bookshelf) by Harsh Jadhav.
