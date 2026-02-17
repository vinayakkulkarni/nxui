---
title: Scroll Float
description: Characters float up from below with scale distortion as you scroll, creating a bouncy entrance effect.
---

::demo-scroll-float
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-float.json"
```

## Props

| Prop                 | Type          | Default  | Description                                          |
| -------------------- | ------------- | -------- | ---------------------------------------------------- |
| `text`               | `string`      | —        | The text content to animate                          |
| `animation-duration` | `number`      | `1`      | Duration of the entrance animation (seconds)         |
| `stagger`            | `number`      | `0.03`   | Delay factor between each character                  |
| `scroll-container`   | `HTMLElement` | `window` | Scroll container element for scroll-linked animation |
| `class`              | `string`      | —        | Additional CSS classes                               |
