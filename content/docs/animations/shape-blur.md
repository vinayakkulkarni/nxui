---
title: Shape Blur
description: SDF shape with cursor-reactive blur distortion rendered via Three.js shaders.
---

::demo-shape-blur
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shape-blur.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variation` | `number` | `0` | Shape variation (0: rounded rect, 1: filled circle, 2: circle stroke, 3: triangle) |
| `shape-size` | `number` | `1.2` | Size of the rounded rect shape |
| `roundness` | `number` | `0.4` | Corner roundness for rounded rect |
| `border-size` | `number` | `0.05` | Stroke width for rounded rect |
| `circle-size` | `number` | `0.3` | Size of the cursor blur circle |
| `circle-edge` | `number` | `0.5` | Edge softness of the cursor blur circle |
