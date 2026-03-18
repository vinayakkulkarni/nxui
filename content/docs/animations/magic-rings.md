---
title: Magic Rings
description: Concentric animated rings with glow, parallax, and click burst effects.
---

::demo-magic-rings
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/magic-rings.json"
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#fc42ff'` | Inner ring color |
| `color-two` | `string` | `'#42fcff'` | Outer ring color |
| `speed` | `number` | `1` | Animation speed |
| `ring-count` | `number` | `6` | Number of rings (1-10) |
| `attenuation` | `number` | `10` | Glow falloff |
| `follow-mouse` | `boolean` | `false` | Cursor tracking |
| `click-burst` | `boolean` | `false` | Click flash effect |
| `blur` | `number` | `0` | CSS blur (px) |
| `hover-scale` | `number` | `1.2` | Scale on hover |
