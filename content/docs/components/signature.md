---
title: Signature
description: Animated handwriting effect that converts text to font glyph paths and reveals them with staggered SVG stroke animations.
---

::demo-signature
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/signature.json"
```

## Props

### Signature

| Prop        | Type      | Default                            | Description                                             |
| ----------- | --------- | ---------------------------------- | ------------------------------------------------------- |
| `text`      | `string`  | `'Signature'`                      | The text to convert into animated glyph paths           |
| `color`     | `string`  | `'currentColor'`                   | Fill color for the revealed text                        |
| `font-size` | `number`  | `32`                               | Font size used to scale the glyph paths                 |
| `duration`  | `number`  | `1.5`                              | Duration of the stroke reveal animation in seconds      |
| `delay`     | `number`  | `0`                                | Base delay before the animation starts                  |
| `class`     | `string`  | `''`                               | Additional CSS classes for the container                |
| `in-view`   | `boolean` | `false`                            | Only animate when the component scrolls into view       |
| `once`      | `boolean` | `true`                             | When `in-view` is true, only trigger the animation once |
| `font-url`  | `string`  | `'/fonts/LastoriaBoldRegular.otf'` | URL to an OpenType font to use for generating the paths |

## Notes

The component needs an OpenType font that can be loaded by [opentype.js](https://opentype.js.org/). nxui ships the **Lastoria Bold** display font locally at `/public/fonts/LastoriaBoldRegular.otf`, which is the default `font-url`. If you install this component via the CLI, make sure the font file is available at that path or provide your own `font-url`.
