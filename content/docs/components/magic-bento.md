---
title: Magic Bento
description: Interactive bento grid with spotlight tracking, particle effects, border glow, and magnetism.
---

::demo-magic-bento
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magic-bento.json"
```

## Props

| Prop                 | Type               | Default         | Description                               |
| -------------------- | ------------------ | --------------- | ----------------------------------------- |
| `items`              | `MagicBentoItem[]` | 6 default cards | Array of card data objects                |
| `glow-color`         | `string`           | `'132, 0, 255'` | RGB values for glow effects               |
| `particle-count`     | `number`           | `12`            | Number of particles per card on hover     |
| `spotlight-radius`   | `number`           | `300`           | Radius of the cursor spotlight in px      |
| `enable-spotlight`   | `boolean`          | `true`          | Enable global cursor spotlight            |
| `enable-border-glow` | `boolean`          | `true`          | Enable border glow on proximity           |
| `enable-particles`   | `boolean`          | `true`          | Enable floating particles on hover        |
| `enable-tilt`        | `boolean`          | `false`         | Enable 3D tilt on hover                   |
| `enable-magnetism`   | `boolean`          | `false`         | Enable slight magnetic pull toward cursor |
| `click-effect`       | `boolean`          | `true`          | Enable ripple effect on click             |
| `text-auto-hide`     | `boolean`          | `true`          | Clamp title/description overflow          |

## Item Interface

```ts
interface MagicBentoItem {
  title: string;
  description: string;
  label?: string;
  color?: string; // Card background color, default '#060010'
}
```

## Features

- **Spotlight** — Global cursor-following light that illuminates nearby cards
- **Border glow** — Cards glow along their border as the cursor approaches
- **Particles** — Floating particles spawn on hover with staggered entry
- **Magnetism** — Cards subtly shift toward the cursor
- **Tilt** — Optional 3D perspective tilt following cursor position
- **Click ripple** — Expanding radial gradient on click
- **Responsive** — 1 column on mobile, 2 on tablet, 4-column bento on desktop
- **Mobile-safe** — All animations disabled on mobile for performance
