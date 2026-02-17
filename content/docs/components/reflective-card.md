---
title: Reflective Card
description: Metallic ID card with SVG displacement filters, live webcam background, and chromatic aberration.
---

::demo-reflective-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/reflective-card.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `blur-strength` | `number` | `12` | Webcam blur radius |
| `color` | `string` | `'white'` | Text color |
| `metalness` | `number` | `1` | Sheen overlay opacity |
| `roughness` | `number` | `0.4` | Noise texture opacity |
| `overlay-color` | `string` | `'rgba(255, 255, 255, 0.1)'` | Content overlay color |
| `displacement-strength` | `number` | `20` | SVG displacement scale |
| `noise-scale` | `number` | `1` | Turbulence frequency scale |
| `specular-constant` | `number` | `1.2` | Specular lighting intensity |
| `grayscale` | `number` | `1` | Grayscale amount (0 = full color, 1 = grayscale) |
| `glass-distortion` | `number` | `0` | Glass edge distortion |
| `name` | `string` | `'ALEXANDER DOE'` | Cardholder name |
| `role` | `string` | `'SENIOR DEVELOPER'` | Cardholder role |
| `id-number` | `string` | `'8901-2345-6789'` | ID number |
