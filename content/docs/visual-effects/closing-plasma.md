---
title: Closing Plasma
description: A premium footer-ready plasma background with atmospheric noise and smooth pointer-driven flow.
---

::demo-closing-plasma
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/closing-plasma.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | `number` | `1` | Animation speed multiplier |
| `turbulence` | `number` | `1` | Amount of layered FBM deformation |
| `mouseInfluence` | `number` | `1` | Strength of pointer distortion |
| `grain` | `number` | `1` | Procedural grain intensity |
| `sparkle` | `number` | `1` | Sparkle highlight intensity |
| `vignette` | `number` | `1` | Edge falloff intensity |
| `opacity` | `number` | `1` | Final alpha of the plasma output |
| `interactive` | `boolean` | `true` | Enables pointer interaction |
| `darkColorA` | `string` | `'#0d0d14'` | Dark palette base tone |
| `darkColorB` | `string` | `'#1f2540'` | Dark palette mid tone |
| `darkColorC` | `string` | `'#4a6191'` | Dark palette highlight tone |
| `lightColorA` | `string` | `'#f0f2f7'` | Light palette base tone |
| `lightColorB` | `string` | `'#d7dceb'` | Light palette mid tone |
| `lightColorC` | `string` | `'#bcc5e0'` | Light palette highlight tone |
| `class` | `string` | — | Additional CSS classes |
