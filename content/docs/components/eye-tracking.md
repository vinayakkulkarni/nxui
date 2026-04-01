---
title: Eye Tracking
description: Animated eyes that follow your cursor with realistic blinking, reactive pupils, and idle micro-movements. Supports realistic, cartoon, minimal, and cyber variants.
---

::demo-eye-tracking
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/eye-tracking.json"
```

## Props

| Prop                   | Type                                               | Default       | Description                              |
| ---------------------- | -------------------------------------------------- | ------------- | ---------------------------------------- |
| `eye-size`             | `number`                                           | `120`         | Diameter of each eye in pixels           |
| `gap`                  | `number`                                           | `40`          | Gap between eyes in pixels               |
| `iris-color`           | `string`                                           | `'#4A6741'`   | Primary iris color                       |
| `iris-color-secondary` | `string`                                           | `'#6B8F62'`   | Secondary iris color (used in gradients) |
| `pupil-color`          | `string`                                           | `'#0a0a0a'`   | Pupil color                              |
| `sclera-color`         | `string`                                           | `'#F5F0EB'`   | Sclera (white of eye) color              |
| `pupil-range`          | `number`                                           | `0.7`         | How far the iris can move (0-1)          |
| `show-reflection`      | `boolean`                                          | `true`        | Show highlight reflection on pupil       |
| `show-iris-detail`     | `boolean`                                          | `true`        | Show iris fiber/circuit pattern detail   |
| `idle-animation`       | `boolean`                                          | `true`        | Enable random micro-movements when idle  |
| `blink-interval`       | `number`                                           | `4000`        | Base interval between blinks in ms       |
| `eye-count`            | `number`                                           | `2`           | Number of eyes to render                 |
| `variant`              | `'realistic' \| 'cartoon' \| 'minimal' \| 'cyber'` | `'realistic'` | Visual style variant                     |
| `reactive-pupil`       | `boolean`                                          | `true`        | Pupil dilates based on cursor proximity  |
| `show-eyelids`         | `boolean`                                          | `true`        | Show eyelid shadow overlays              |
| `class`                | `string`                                           | `''`          | Additional CSS classes                   |

## Variants

```vue
<!-- Realistic: blood vessels, radial gradient sclera, fiber iris lines -->
<EyeTracking variant="realistic" />

<!-- Cartoon: bold colors, thick outlines, solid iris -->
<EyeTracking variant="cartoon" />

<!-- Minimal: clean, thin outline, simple solid iris -->
<EyeTracking variant="minimal" />

<!-- Cyber: dark sclera, conic-gradient iris, scan line, cyan glow -->
<EyeTracking variant="cyber" iris-color="#00f0ff" />
```
