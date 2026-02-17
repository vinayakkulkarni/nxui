---
title: Scroll Reveal
description: Text that reveals word by word as you scroll, with optional blur and rotation effects.
---

::demo-scroll-reveal
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-reveal.json"
```

## Props

| Prop            | Type      | Default | Description                              |
| --------------- | --------- | ------- | ---------------------------------------- |
| `text`          | `string`  | —       | The text content to reveal               |
| `enable-blur`   | `boolean` | `true`  | Enable blur-to-clear transition per word |
| `base-opacity`  | `number`  | `0.1`   | Starting opacity for unrevealed words    |
| `base-rotation` | `number`  | `3`     | Initial rotation in degrees              |
| `blur-strength` | `number`  | `4`     | Maximum blur in pixels                   |
| `class`         | `string`  | —       | Additional CSS classes                   |
