---
title: Logo Loop
description: Infinite scrolling logo marquee with smooth animation and fade edges.
---

::demo-logo-loop
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/logo-loop.json"
```

## Props

| Prop             | Type                                  | Default          | Description                                           |
| ---------------- | ------------------------------------- | ---------------- | ----------------------------------------------------- |
| `speed`          | `number`                              | `120`            | Animation speed in pixels per second                  |
| `direction`      | `'left' \| 'right' \| 'up' \| 'down'` | `'left'`         | Direction of the scroll animation                     |
| `logo-height`    | `number`                              | `28`             | Height of the logos in pixels (also sets font-size)   |
| `gap`            | `number`                              | `32`             | Gap between logos in pixels                           |
| `pause-on-hover` | `boolean`                             | `false`          | Whether to pause on hover                             |
| `hover-speed`    | `number`                              | —                | Custom speed when hovering (overrides pause-on-hover) |
| `fade-out`       | `boolean`                             | `false`          | Apply gradient fade at the edges                      |
| `fade-out-color` | `string`                              | —                | Custom color for the fade gradient                    |
| `scale-on-hover` | `boolean`                             | `false`          | Scale logos on hover                                  |
| `aria-label`     | `string`                              | `'Logo marquee'` | Accessibility label                                   |
| `class`          | `string`                              | —                | Additional CSS classes                                |
