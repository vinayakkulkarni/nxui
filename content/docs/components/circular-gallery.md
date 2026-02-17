---
title: Circular Gallery
description: OGL-powered curved image gallery with drag/scroll navigation and wave deformation.
---

::demo-circular-gallery
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circular-gallery.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `GalleryItem[]` | 6 defaults | Array of items with image and text |
| `bend` | `number` | `3` | Curve bend amount (0 = flat) |
| `text-color` | `string` | `'#ffffff'` | Caption text color |
| `border-radius` | `number` | `0.05` | Image corner radius (0–0.5) |
| `scroll-speed` | `number` | `2` | Scroll/drag speed multiplier |
| `scroll-ease` | `number` | `0.05` | Scroll easing factor |
