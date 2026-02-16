---
title: Magnet Lines
description: Lines that bend toward the cursor like a magnetic field with smooth transitions.
---

::demo-magnet-lines
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magnet-lines.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| lineCount | `number` | `40` | Number of vertical lines to render. |
| lineColor | `string` | `'currentColor'` | Color of the lines. |
| lineWidth | `number` | `1` | Width of each line in pixels. |
| magnetStrength | `number` | `0.5` | Strength of the magnetic effect (0-1). |
| class | `string` | - | Additional CSS classes for the container. |
