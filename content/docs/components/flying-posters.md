---
title: Flying Posters
description: OGL-powered vertical scroll gallery with rotating poster distortion.
---

::demo-flying-posters
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flying-posters.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `string[]` | `[]` | Array of image URLs |
| `plane-width` | `number` | `320` | Poster width in viewport units |
| `plane-height` | `number` | `320` | Poster height in viewport units |
| `distortion` | `number` | `3` | Rotation distortion strength |
| `scroll-ease` | `number` | `0.01` | Scroll lerp easing factor |
| `camera-fov` | `number` | `45` | Camera field of view |
| `camera-z` | `number` | `20` | Camera Z distance |
