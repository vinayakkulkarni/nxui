---
title: Glass Surface
description: SVG displacement-based glass distortion element with chromatic aberration and frosted backdrop filter.
---

::demo-glass-surface
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glass-surface.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | number or string | 200 | Container width |
| height | number or string | 80 | Container height |
| border-radius | number | 20 | Corner radius in pixels |
| border-width | number | 0.07 | Refraction edge ratio |
| brightness | number | 50 | Inner brightness (0-100) |
| opacity | number | 0.93 | Inner opacity |
| blur | number | 11 | Inner blur radius |
| displace | number | 0 | Output Gaussian blur |
| background-opacity | number | 0 | Frost background opacity |
| saturation | number | 1 | Backdrop saturation |
| distortion-scale | number | -180 | Chromatic distortion scale |
| red-offset | number | 0 | Red channel distortion offset |
| green-offset | number | 10 | Green channel offset |
| blue-offset | number | 20 | Blue channel offset |
| x-channel | string | 'R' | X displacement channel |
| y-channel | string | 'G' | Y displacement channel |
| mix-blend-mode | string | 'difference' | Map blend mode |
