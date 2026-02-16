---
title: Dither Prism Hero
description: A prismatic dithered hero section with advanced WebGL shaders featuring ordered dithering, holographic iridescence, and floating particles.
---

::demo-dither-prism-hero
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dither-prism-hero.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title1` | `string` | — | First line of the headline |
| `title2` | `string` | — | Second line of the headline |
| `color1` | `string` | `'#0f0f23'` | Primary color (deep/dark) |
| `color2` | `string` | `'#6366f1'` | Secondary color (mid) |
| `color3` | `string` | `'#ec4899'` | Tertiary color (light/accent) |
| `speed` | `number` | `1` | Animation speed multiplier |
| `ditherIntensity` | `number` | `0.15` | Dithering intensity (0–1) |
| `prismIntensity` | `number` | `0.5` | Prismatic refraction intensity (0–1) |
| `particleCount` | `number` | `50` | Number of floating particles |
| `showParticles` | `boolean` | `true` | Show floating particles |
| `particleColor` | `string` | `'#ffffff'` | Particle color |
| `class` | `string` | — | Additional CSS classes |
