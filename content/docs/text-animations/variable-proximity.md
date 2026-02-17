---
title: Variable Proximity
description: Text that changes font variation settings based on cursor proximity, creating a magnetic weight/width effect.
---

::demo-variable-proximity
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/variable-proximity.json"
```


## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | The text content to display |
| `from-font-variation-settings` | `string` | — | Font variation settings when cursor is far (e.g. `'wght' 400`) |
| `to-font-variation-settings` | `string` | — | Font variation settings when cursor is near (e.g. `'wght' 900`) |
| `container-ref` | `HTMLElement \| null` | — | Reference to the container element for cursor tracking |
| `radius` | `number` | `50` | Pixel radius of the proximity effect |
| `falloff` | `'linear' \| 'exponential' \| 'gaussian'` | `'linear'` | Easing curve for the proximity falloff |
| `class` | `string` | — | Additional CSS classes |


## Notes

This component works best with variable fonts that support axes like `wght` (weight), `wdth` (width), or `opsz` (optical size). Use Google Fonts variable fonts or any font with OpenType variation axes.
