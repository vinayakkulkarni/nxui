---
title: Waves
description: Perlin noise-driven wave lines with cursor-reactive distortion.
---

::demo-waves
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/waves.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `line-color` | `string` | `'black'` | Color of the wave lines |
| `background-color` | `string` | `'transparent'` | Background color |
| `wave-speed-x` | `number` | `0.0125` | Horizontal wave speed |
| `wave-speed-y` | `number` | `0.005` | Vertical wave speed |
| `wave-amp-x` | `number` | `32` | Horizontal wave amplitude |
| `wave-amp-y` | `number` | `16` | Vertical wave amplitude |
| `x-gap` | `number` | `10` | Horizontal gap between lines |
| `y-gap` | `number` | `32` | Vertical gap between points |
| `friction` | `number` | `0.925` | Cursor effect friction |
| `tension` | `number` | `0.005` | Cursor effect tension |
| `max-cursor-move` | `number` | `100` | Max cursor displacement |
| `class` | `string` | — | Additional CSS classes |
