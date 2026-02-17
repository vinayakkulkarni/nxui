---
title: Carousel
description: Draggable card carousel with 3D perspective rotation and dot indicators.
---

::demo-carousel
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/carousel.json"
```

## Props

| Prop             | Type             | Default    | Description                                |
| ---------------- | ---------------- | ---------- | ------------------------------------------ |
| `items`          | `CarouselItem[]` | 5 defaults | Array of items with title, description, id |
| `base-width`     | `number`         | `300`      | Container width in pixels                  |
| `autoplay`       | `boolean`        | `false`    | Enable auto-cycling                        |
| `autoplay-delay` | `number`         | `3000`     | Delay between auto cycles in ms            |
| `pause-on-hover` | `boolean`        | `false`    | Pause autoplay on hover                    |
| `loop`           | `boolean`        | `false`    | Enable infinite loop                       |
| `round`          | `boolean`        | `false`    | Circular card style                        |
