---
title: Letter Glitch
description: A grid of random characters with color glitching and vignette overlays.
---

::demo-letter-glitch
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/letter-glitch.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glitch-colors` | `string[]` | `['#2b4539', '#61dca3', '#61b3dc']` | Array of hex colors for glitch effect |
| `glitch-speed` | `number` | `50` | Interval in ms between glitch updates |
| `center-vignette` | `boolean` | `false` | Show dark center vignette overlay |
| `outer-vignette` | `boolean` | `true` | Show dark outer vignette overlay |
| `smooth` | `boolean` | `true` | Enable smooth color transitions |
| `characters` | `string` | `'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()...'` | Character set for glitch text |
| `class` | `string` | — | Additional CSS classes |
