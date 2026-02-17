---
title: Balatro
description: Psychedelic spinning paint effect with configurable colors and pixel filtering.
---

::demo-balatro
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/balatro.json"
```

## Props

| Prop                | Type               | Default     | Description                     |
| ------------------- | ------------------ | ----------- | ------------------------------- |
| `spin-rotation`     | `number`           | `-2.0`      | Rotation angle of the spin      |
| `spin-speed`        | `number`           | `7.0`       | Speed of the spin animation     |
| `offset`            | `[number, number]` | `[0, 0]`    | X/Y offset of the effect center |
| `color1`            | `string`           | `'#DE443B'` | Primary color (hex)             |
| `color2`            | `string`           | `'#006BB4'` | Secondary color (hex)           |
| `color3`            | `string`           | `'#162325'` | Tertiary color (hex)            |
| `contrast`          | `number`           | `3.5`       | Color contrast level            |
| `lighting`          | `number`           | `0.4`       | Lighting intensity              |
| `spin-amount`       | `number`           | `0.25`      | Amount of spin distortion       |
| `pixel-filter`      | `number`           | `745.0`     | Pixel grid resolution           |
| `spin-ease`         | `number`           | `1.0`       | Easing factor for spin          |
| `is-rotate`         | `boolean`          | `false`     | Enable continuous rotation      |
| `mouse-interaction` | `boolean`          | `true`      | Enable mouse influence          |
| `class`             | `string`           | —           | Additional CSS classes          |
