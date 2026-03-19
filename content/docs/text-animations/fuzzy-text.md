---
title: Fuzzy Text
description: Canvas-based fuzzy blur text with hover intensity, directional displacement, glitch mode, gradient fill, and click effects.
---

::demo-fuzzy-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fuzzy-text.json"
```

## Props

| Prop                  | Type                                   | Default                    | Description                                  |
| --------------------- | -------------------------------------- | -------------------------- | -------------------------------------------- |
| `text`                | `string`                               | —                          | Text content to display                      |
| `font-size`           | `string`                               | `'clamp(2rem, 8vw, 8rem)'` | CSS font size                                |
| `font-weight`         | `number`                               | `900`                      | Font weight                                  |
| `font-family`         | `string`                               | `''`                       | Custom font family                           |
| `color`               | `string`                               | `''`                       | Text color (auto-detected from CSS if empty) |
| `enable-hover`        | `boolean`                              | `true`                     | Enable hover intensity change                |
| `base-intensity`      | `number`                               | `0.18`                     | Idle fuzz intensity (0–1)                    |
| `hover-intensity`     | `number`                               | `0.5`                      | Hover fuzz intensity (0–1)                   |
| `fuzz-range`          | `number`                               | `30`                       | Maximum pixel displacement                   |
| `direction`           | `'horizontal' \| 'vertical' \| 'both'` | `'both'`                   | Displacement axis                            |
| `transition-duration` | `number`                               | `300`                      | Intensity transition time in ms              |
| `click-effect`        | `boolean`                              | `false`                    | Burst to full intensity on click             |
| `glitch-mode`         | `boolean`                              | `false`                    | Periodic auto-glitch bursts                  |
| `glitch-interval`     | `number`                               | `2000`                     | Time between glitch bursts (ms)              |
| `glitch-duration`     | `number`                               | `200`                      | Duration of each glitch burst (ms)           |
| `gradient`            | `string[] \| null`                     | `null`                     | Gradient colors (replaces solid color)       |
| `letter-spacing`      | `number`                               | `0`                        | Custom letter spacing (0 = normal)           |
| `fps`                 | `number`                               | `0`                        | Frame rate limit (0 = unlimited)             |
