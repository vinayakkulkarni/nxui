---
title: Grid Distortion
description: Three.js shader-based image distortion that warps a texture in response to mouse movement.
---

::demo-grid-distortion
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/grid-distortion.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `image-src` | `string` | required | URL of the image to distort |
| `grid` | `number` | `15` | Grid subdivision count |
| `mouse` | `number` | `0.1` | Mouse influence radius (0-1) |
| `strength` | `number` | `0.15` | Distortion strength |
| `relaxation` | `number` | `0.9` | How quickly distortion relaxes back |
