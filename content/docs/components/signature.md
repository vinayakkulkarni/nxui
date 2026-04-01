---
title: Signature
description: Animated handwriting effect that uses font glyph paths to simulate realistic pen strokes with staggered SVG path animations.
---

::demo-signature
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/signature.json"
```

## Props

| Prop        | Type      | Default                                             | Description                                  |
| ----------- | --------- | --------------------------------------------------- | -------------------------------------------- |
| `text`      | `string`  | `'Signature'`                                       | The text to render as a signature            |
| `color`     | `string`  | `'currentColor'`                                    | Fill color of the signature                  |
| `font-size` | `number`  | `32`                                                | Font size in pixels                          |
| `duration`  | `number`  | `1.5`                                               | Animation duration per character in seconds  |
| `delay`     | `number`  | `0`                                                 | Initial delay before animation starts        |
| `in-view`   | `boolean` | `false`                                             | Trigger animation when element enters view   |
| `once`      | `boolean` | `true`                                              | Only animate once when in view               |
| `font-url`  | `string`  | `'https://componentry.fun/LastoriaBoldRegular.otf'` | URL to the OTF font file for glyph rendering |
| `class`     | `string`  | —                                                   | Additional CSS classes                       |

## Dependencies

This component requires `opentype.js` for font loading and glyph path extraction:

```bash
bun add opentype.js
```
