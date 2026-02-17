---
title: Masonry
description: Responsive masonry image grid with blur-to-focus entrance animation and hover scaling.
---

::demo-masonry
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/masonry.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | MasonryItem[] | [] | Array of items with id, img, height |
| scale-on-hover | boolean | true | Scale down on hover |
| hover-scale | number | 0.95 | Scale factor on hover |
| blur-to-focus | boolean | true | Animate from blurred to focused on enter |

## MasonryItem

| Prop | Type | Description |
|------|------|-------------|
| id | string \| number | Unique identifier |
| img | string | Image URL |
| height | number | Image height (used for layout) |
| url | string | Optional link URL |
