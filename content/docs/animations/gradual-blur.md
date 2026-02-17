---
title: Gradual Blur
description: Layered backdrop-filter blur gradient overlay for smooth edge fading.
---

::demo-gradual-blur
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/gradual-blur.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Edge to blur from |
| `strength` | `number` | `2` | Blur intensity multiplier |
| `height` | `string` | `'6rem'` | Size of the blur zone |
| `div-count` | `number` | `5` | Number of layered blur divisions |
| `exponential` | `boolean` | `false` | Use exponential blur curve |
| `opacity` | `number` | `1` | Overall opacity |
| `curve` | `string` | `'linear'` | Easing curve for blur distribution |
