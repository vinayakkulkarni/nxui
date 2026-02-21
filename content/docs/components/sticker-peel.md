---
title: Sticker Peel
description: Interactive sticker peel effect with CSS clip-path, SVG lighting filters, and drag interaction.
---

::demo-sticker-peel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/sticker-peel.json"
```

## Props

| Prop                  | Type     | Default | Description                             |
| --------------------- | -------- | ------- | --------------------------------------- |
| `image-src`           | `string` | —       | Image URL (required)                    |
| `rotate`              | `number` | `30`    | Initial rotation angle                  |
| `peel-back-hover-pct` | `number` | `30`    | Peel percentage on hover                |
| `peel-back-active-pct`| `number` | `40`    | Peel percentage when active/dragging    |
| `width`               | `number` | `200`   | Sticker width in px                     |
| `shadow-intensity`    | `number` | `0.6`   | Drop shadow opacity                     |
| `lighting-intensity`  | `number` | `0.1`   | SVG specular lighting intensity         |
| `peel-direction`      | `number` | `0`     | Peel angle direction                    |
