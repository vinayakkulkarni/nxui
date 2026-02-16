---
title: Particle Galaxy
description: A swirling 3D particle galaxy effect with spiral arms that responds to mouse movement.
---

::demo-particle-galaxy
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/particle-galaxy.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| particleCount | `number` | `1500` | Number of particles to render. |
| color | `string` | `'#8b5cf6'` | Color of the particles. |
| mouseInfluence | `number` | `0.3` | Strength of mouse interaction (0-1). |
| speed | `number` | `0.5` | Animation speed multiplier. |
| class | `string` | - | Additional CSS classes for the container. |
