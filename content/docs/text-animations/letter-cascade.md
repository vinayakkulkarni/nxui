---
title: Letter Cascade
description: A 3D split-flap letter animation with spring physics that cascades on hover or click.
---

::demo-letter-cascade
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/letter-cascade.json"
```

## Props

| Prop               | Type                                       | Default   | Description                                  |
| ------------------ | ------------------------------------------ | --------- | -------------------------------------------- |
| `text`             | `string`                                   | —         | The text to animate                          |
| `stagger-duration` | `number`                                   | `0.04`    | Stagger delay between each letter in seconds |
| `stagger-from`     | `'first' \| 'last' \| 'center' \| number` | `'first'` | Where the stagger wave originates            |
| `stiffness`        | `number`                                   | `220`     | Spring stiffness — higher = snappier         |
| `damping`          | `number`                                   | `16`      | Spring damping — lower = bouncier            |
| `trigger-on-click` | `boolean`                                  | `false`   | Trigger animation on click instead of hover  |
| `class`            | `string`                                   | —         | Additional CSS classes for the container     |
| `letter-class`     | `string`                                   | —         | CSS classes applied to each individual letter |
