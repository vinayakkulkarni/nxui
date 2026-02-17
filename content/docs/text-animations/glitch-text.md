---
title: Glitch Text
description: RGB split and distortion glitch effect with jitter animations and optional hover trigger.
---

::demo-glitch-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/glitch-text.json"
```

## Props

| Prop              | Type      | Default | Description                                    |
| ----------------- | --------- | ------- | ---------------------------------------------- |
| `text`            | `string`  | —       | The text content to display with glitch effect |
| `speed`           | `number`  | `0.5`   | Animation speed multiplier                     |
| `enable-shadows`  | `boolean` | `true`  | Show red/cyan RGB split shadows                |
| `enable-on-hover` | `boolean` | `false` | Only glitch on hover instead of continuously   |
| `class`           | `string`  | —       | Additional CSS classes for styling             |
