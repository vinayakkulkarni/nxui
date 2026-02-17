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

| Prop              | Type      | Default     | Description                       |
| ----------------- | --------- | ----------- | --------------------------------- |
| `speed`           | `number`  | `1`         | Animation speed multiplier        |
| `turbulence`      | `number`  | `1`         | Amount of layered FBM deformation |
| `mouse-influence` | `number`  | `1`         | Strength of pointer distortion    |
| `grain`           | `number`  | `1`         | Procedural grain intensity        |
| `sparkle`         | `number`  | `1`         | Sparkle highlight intensity       |
| `vignette`        | `number`  | `1`         | Edge falloff intensity            |
| `opacity`         | `number`  | `1`         | Final alpha of the plasma output  |
| `interactive`     | `boolean` | `true`      | Enables pointer interaction       |
| `dark-color-a`    | `string`  | `'#0d0d14'` | Dark palette base tone            |
| `dark-color-b`    | `string`  | `'#1f2540'` | Dark palette mid tone             |
| `dark-color-c`    | `string`  | `'#4a6191'` | Dark palette highlight tone       |
| `light-color-a`   | `string`  | `'#f0f2f7'` | Light palette base tone           |
| `light-color-b`   | `string`  | `'#d7dceb'` | Light palette mid tone            |
| `light-color-c`   | `string`  | `'#bcc5e0'` | Light palette highlight tone      |
| `class`           | `string`  | —           | Additional CSS classes            |
