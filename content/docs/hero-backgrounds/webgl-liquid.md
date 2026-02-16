---
title: WebGL Liquid
description: A premium liquid hero background powered by raw WebGL shaders, with configurable palette, grain, reveal timing, and flow behavior.
---

::demo-web-g-l-liquid
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/webgl-liquid.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Fluid Motion'` | Primary headline line |
| `subtitle` | `string` | `'Premium Presence'` | Secondary headline line |
| `description` | `string` | — | Supporting hero copy below the title |
| `colorDeep` | `string` | `'#04050b'` | Base dark tone used in the liquid gradient |
| `colorMid` | `string` | `'#134d93'` | Mid tone for blending transitions |
| `colorHighlight` | `string` | `'#8cecff'` | Highlight tone for bright accents and glow |
| `speed` | `number` | `1` | Global animation speed multiplier |
| `flowStrength` | `number` | `1` | Intensity of flow distortion and liquid drift |
| `grain` | `number` | `0.05` | Dither grain amount applied in the shader |
| `contrast` | `number` | `1.1` | Shader contrast applied after color mixing |
| `opacity` | `number` | `0.95` | Overall alpha of the liquid layer |
| `reveal` | `boolean` | `true` | Enables left-to-right entrance wipe |
| `delayMs` | `number` | `0` | Delay before animation/reveal begins (ms) |
| `revealDuration` | `number` | `1.2` | Duration of the reveal wipe in seconds |
| `class` | `string` | — | Additional CSS classes |
