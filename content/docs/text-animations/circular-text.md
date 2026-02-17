---
title: Circular Text
description: Layouts characters around a circle with optional rotation animation.
---

::demo-circular-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/circular-text.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | The text to display around the circle |
| `radius` | `number` | `80` | Radius of the circle in pixels |
| `font-size` | `number` | `14` | Font size of the characters in pixels |
| `spin` | `boolean` | `true` | Whether to continuously rotate |
| `spin-duration` | `number` | `20` | Duration of one full rotation in seconds |
| `class` | `string` | — | Additional CSS classes for styling |
