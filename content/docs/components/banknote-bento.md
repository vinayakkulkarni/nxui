---
title: Banknote Bento
description: Vintage engravings rendered as ink-on-paper banknote duotones with serif captions, plus a thermal-camera card whose heat boundary rises over the artwork and types its caption.
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

  // Engravings must be CORS-readable for the thermal card (canvas pixels).
  const items = [
    {
      src: '/engravings/portrait.jpg',
      caption: 'the future of banking, with no fees.',
      ink: '#5b21b6',
      span: 'wide',
      storeBadge: true,
      focus: '50% 34%',
      zoom: 2.4,
    },
    {
      src: '/engravings/deluge.jpg',
      caption: 'liquidity in motion.',
      ink: '#14532d',
      span: 'tall',
      thermal: true,
    },
  ];
</script>

<template>
  <BanknoteBento :items="items" paper="#eae6da" :thermal-cycle="9" />
</template>
```

Each card flattens its engraving to luminance and remaps it as an
ink-on-paper duotone — dark engraved lines take the `ink` color, highlights
take the shared `paper` color, exactly like banknote intaglio printing. A
card with `thermal: true` runs a thermal-camera cycle instead: a noisy heat
boundary climbs from the bottom remapping the artwork's luminance through a
rainbow thermal palette, a white-hot rim traces the boundary, and the
caption types itself out in mono while the card runs hot, then everything
recedes back to the cold duotone. `focus` and `zoom` control the cover
crop, `span: 'wide' | 'tall'` the bento footprint.

## Props

### BanknoteBento

| Prop            | Type                  | Default     | Description                             |
| --------------- | --------------------- | ----------- | --------------------------------------- |
| `items`         | `BanknoteBentoItem[]` | —           | Cards, placed in order into the grid    |
| `paper`         | `string`              | `'#eae6da'` | Paper color shared by all duotones      |
| `thermal-cycle` | `number`              | `9`         | Seconds per thermal rise-and-fall cycle |

### BanknoteBentoItem

| Field             | Type                                                           | Default      | Description                                     |
| ----------------- | -------------------------------------------------------------- | ------------ | ----------------------------------------------- |
| `src`             | `string`                                                       | —            | Engraving scan URL (CORS-readable when thermal) |
| `caption`         | `string`                                                       | —            | Serif caption; typed out on thermal cards       |
| `captionPosition` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'` | Caption corner                                  |
| `captionColor`    | `string`                                                       | paper tone   | Caption color override                          |
| `ink`             | `string`                                                       | `'#1c1917'`  | Duotone ink color for the engraved lines        |
| `span`            | `'wide' \| 'tall' \| 'square'`                                 | `'square'`   | Grid footprint                                  |
| `storeBadge`      | `boolean`                                                      | `false`      | App Store chip in the bottom-right              |
| `thermal`         | `boolean`                                                      | `false`      | Run the thermal-camera cycle on this card       |
| `focus`           | `string`                                                       | `'50% 50%'`  | Cover-crop focal point (`x% y%`)                |
| `zoom`            | `number`                                                       | `1`          | Extra zoom into the focal point                 |

## Credits

Ported from the "brutally fresh bento cards" exploration by
[@saintdsgn](https://x.com/saintdsgn/status/2074581394869617137), made in
[@paper](https://paper.design). Demo engravings are public-domain scans from
[Wikimedia Commons](https://commons.wikimedia.org).
