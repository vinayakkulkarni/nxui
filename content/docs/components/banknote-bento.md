---
title: Banknote Bento
description: Engraving-style bento cards with duotone tints, serif captions, and an ironbow thermal card whose procedural heat field rises and falls over the artwork.
---

::demo-banknote-bento
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/banknote-bento.json"
```

## Usage

```vue
<script setup lang="ts">
  import BanknoteBento from '~/components/ui/banknote-bento/BanknoteBento.vue';

  const items = [
    {
      src: '/engravings/portrait.jpg',
      caption: 'the future of banking, with no fees.',
      tint: '#7c3aed',
      span: 'wide',
      storeBadge: true,
    },
    {
      src: '/engravings/allegory.jpg',
      caption: 'liquidity in motion.',
      tint: '#166534',
      span: 'tall',
      thermal: true,
    },
  ];
</script>

<template>
  <BanknoteBento :items="items" :thermal-cycle="8" />
</template>
```

Each card renders its image grayscale with a duotone tint blended over it —
the banknote-engraving look. A card with `thermal: true` gets a procedural
ironbow heat field (black → purple → red → orange → yellow) generated on a
canvas with value noise, breathing up and down over the artwork on a
configurable cycle. Cards fade-and-rise into view with a stagger, and
`span: 'wide' | 'tall'` controls the bento footprint.

## Props

### BanknoteBento

| Prop            | Type                  | Default | Description                             |
| --------------- | --------------------- | ------- | --------------------------------------- |
| `items`         | `BanknoteBentoItem[]` | —       | Cards, placed in order into the grid    |
| `thermal-cycle` | `number`              | `8`     | Seconds per thermal rise-and-fall cycle |

### BanknoteBentoItem

| Field             | Type                                                           | Default      | Description                              |
| ----------------- | -------------------------------------------------------------- | ------------ | ---------------------------------------- |
| `src`             | `string`                                                       | —            | Engraving-style image URL                |
| `caption`         | `string`                                                       | —            | Serif caption over the image             |
| `captionPosition` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'` | Caption corner                           |
| `tint`            | `string`                                                       | —            | Duotone tint color                       |
| `span`            | `'wide' \| 'tall' \| 'square'`                                 | `'square'`   | Grid footprint                           |
| `storeBadge`      | `boolean`                                                      | `false`      | App Store chip in the bottom-right       |
| `thermal`         | `boolean`                                                      | `false`      | Animated ironbow heat field on this card |

## Credits

Ported from the "brutally fresh bento cards" exploration by
[@saintdsgn](https://x.com/saintdsgn/status/2074581394869617137), made in
[@paper](https://paper.design).
