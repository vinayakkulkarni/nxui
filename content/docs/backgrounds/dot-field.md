---
title: Dot Field
description: Interactive canvas dot grid with cursor bulge, glow, sparkle, and wave effects.
---

::demo-dot-field
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/dot-field.json"
```

## Props

| Prop             | Type      | Default                       | Description                     |
| ---------------- | --------- | ----------------------------- | ------------------------------- |
| `dot-radius`     | `number`  | `1.5`                         | Radius of each dot              |
| `dot-spacing`    | `number`  | `14`                          | Spacing between dots            |
| `cursor-radius`  | `number`  | `500`                         | Cursor interaction radius       |
| `cursor-force`   | `number`  | `0.1`                         | Force of cursor on dots         |
| `bulge-only`     | `boolean` | `true`                        | Use bulge mode vs velocity mode |
| `bulge-strength` | `number`  | `67`                          | Strength of bulge effect        |
| `glow-radius`    | `number`  | `160`                         | Radius of SVG glow effect       |
| `sparkle`        | `boolean` | `false`                       | Enable sparkle effect           |
| `wave-amplitude` | `number`  | `0`                           | Amplitude of wave perturbation  |
| `gradient-from`  | `string`  | `'rgba(168, 85, 247, 0.35)'`  | Gradient start color            |
| `gradient-to`    | `string`  | `'rgba(180, 151, 207, 0.25)'` | Gradient end color              |
| `glow-color`     | `string`  | `'#120F17'`                   | Color of the SVG glow circle    |
