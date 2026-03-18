---
title: Prism
description: A prismatic light refraction background rendered with WebGL shaders.
---

::demo-prism
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/prism.json"
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `height` | `number` | `3.5` | Apex height |
| `base-width` | `number` | `5.5` | Base width |
| `animation-type` | `'rotate' \| 'hover' \| '3drotate'` | `'rotate'` | Animation mode |
| `glow` | `number` | `1` | Glow intensity |
| `noise` | `number` | `0.5` | Film grain |
| `scale` | `number` | `3.6` | Screen-space scale |
| `time-scale` | `number` | `0.5` | Animation speed |
