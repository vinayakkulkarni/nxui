---
title: Ballpit
description: 3D physics-based ball pit with instanced meshes, subsurface scattering, and cursor interaction.
---

::demo-ballpit
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/ballpit.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `200` | Number of spheres in the pit |
| `colors` | `number[]` | `[0x000000]` | Array of hex colors for gradient coloring |
| `follow-cursor` | `boolean` | `true` | Whether sphere 0 follows the cursor |
| `ambient-color` | `number` | `0xffffff` | Ambient light color |
| `ambient-intensity` | `number` | `1` | Ambient light intensity |
| `light-intensity` | `number` | `200` | Point light intensity |
| `min-size` | `number` | `0.5` | Minimum sphere radius |
| `max-size` | `number` | `1` | Maximum sphere radius |
| `size0` | `number` | `1` | Size of the cursor-following sphere |
| `gravity` | `number` | `0.5` | Gravity force (0 for floating) |
| `friction` | `number` | `0.9975` | Velocity damping per frame |
| `wall-bounce` | `number` | `0.95` | Bounce coefficient off walls |
| `max-velocity` | `number` | `0.15` | Maximum sphere velocity |
| `metalness` | `number` | `0.5` | PBR metalness |
| `roughness` | `number` | `0.5` | PBR roughness |
| `clearcoat` | `number` | `1` | PBR clearcoat |
| `clearcoat-roughness` | `number` | `0.15` | PBR clearcoat roughness |
