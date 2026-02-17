---
title: Fuzzy Text
description: Canvas-based vibrating fuzzy text with horizontal displacement that intensifies on hover.
---

::demo-fuzzy-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/fuzzy-text.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | The text content to display |
| `font-size` | `string` | `'clamp(2rem, 8vw, 8rem)'` | CSS font-size value |
| `font-weight` | `number` | `900` | Font weight |
| `color` | `string` | `''` | Text color (defaults to inherited color) |
| `enable-hover` | `boolean` | `true` | Whether hover increases intensity |
| `base-intensity` | `number` | `0.18` | Base fuzz intensity (0-1) |
| `hover-intensity` | `number` | `0.5` | Fuzz intensity on hover (0-1) |
| `fuzz-range` | `number` | `30` | Maximum pixel displacement range |
| `class` | `string` | — | Additional CSS classes |
