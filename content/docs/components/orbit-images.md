---
title: Orbit Images
description: Images orbiting along customizable path shapes including ellipse, circle, star, heart, infinity, and more.
---

::demo-orbit-images
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orbit-images.json"
```

## Props

| Prop               | Type                              | Default             | Description                                                                           |
| ------------------ | --------------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `images`           | `{ src: string; alt?: string }[]` | `[]`                | Array of image objects                                                                |
| `shape`            | `string`                          | `'ellipse'`         | Path shape: ellipse, circle, square, rectangle, triangle, star, heart, infinity, wave |
| `base-width`       | `number`                          | `1400`              | Design coordinate space width                                                         |
| `radius-x`         | `number`                          | `700`               | Horizontal radius (ellipse, rectangle, infinity, wave)                                |
| `radius-y`         | `number`                          | `170`               | Vertical radius (ellipse, rectangle, infinity, wave)                                  |
| `radius`           | `number`                          | `300`               | Radius (circle, square, triangle, star, heart)                                        |
| `star-points`      | `number`                          | `5`                 | Number of star points (star shape only)                                               |
| `star-inner-ratio` | `number`                          | `0.5`               | Inner radius ratio for star shape                                                     |
| `rotation`         | `number`                          | `-8`                | Global rotation in degrees                                                            |
| `duration`         | `number`                          | `40`                | Full orbit duration in seconds                                                        |
| `item-size`        | `number`                          | `64`                | Image size in px                                                                      |
| `direction`        | `'normal' \| 'reverse'`           | `'normal'`          | Orbit direction                                                                       |
| `fill`             | `boolean`                         | `true`              | Distribute images evenly along path                                                   |
| `show-path`        | `boolean`                         | `false`             | Show the orbit path as SVG                                                            |
| `path-color`       | `string`                          | `'rgba(0,0,0,0.1)'` | Path stroke color                                                                     |
| `path-width`       | `number`                          | `2`                 | Path stroke width                                                                     |
| `paused`           | `boolean`                         | `false`             | Pause the animation                                                                   |
| `responsive`       | `boolean`                         | `false`             | Scale to container width                                                              |
