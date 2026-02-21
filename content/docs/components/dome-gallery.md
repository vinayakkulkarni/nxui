---
title: Dome Gallery
description: 3D dome-shaped image gallery with CSS transforms, drag interaction, and click-to-enlarge.
---

::demo-dome-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dome-gallery.json"
```

## Props

| Prop                        | Type                                              | Default  | Description                |
| --------------------------- | ------------------------------------------------- | -------- | -------------------------- |
| `images`                    | `(string \| GalleryImage)[]`                      | Built-in | Array of images            |
| `fit`                       | `number`                                          | —        | Force items to fit         |
| `fit-basis`                 | `'auto' \| 'min' \| 'max' \| 'width' \| 'height'` | `'auto'` | Dimension basis for fit    |
| `min-radius`                | `number`                                          | —        | Minimum dome radius        |
| `max-radius`                | `number`                                          | —        | Maximum dome radius        |
| `pad-factor`                | `number`                                          | —        | Padding between items      |
| `overlay-blur-color`        | `string`                                          | —        | Blur overlay color         |
| `max-vertical-rotation-deg` | `number`                                          | —        | Max vertical tilt degrees  |
| `drag-sensitivity`          | `number`                                          | —        | Drag speed multiplier      |
| `enlarge-transition-ms`     | `number`                                          | —        | Enlarge animation duration |
| `segments`                  | `number`                                          | —        | Number of dome segments    |
| `grayscale`                 | `boolean`                                         | `false`  | Show images in grayscale   |
