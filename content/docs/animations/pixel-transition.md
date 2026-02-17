---
title: Pixel Transition
description: Pixelated grid transition that reveals a second content layer on hover.
---

::demo-pixel-transition
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pixel-transition.json"
```

## Props

| Prop                      | Type      | Default          | Description                                      |
| ------------------------- | --------- | ---------------- | ------------------------------------------------ |
| `grid-size`               | `number`  | `7`              | Number of rows and columns in the pixel grid     |
| `pixel-color`             | `string`  | `'currentColor'` | Color of the transition pixels                   |
| `animation-step-duration` | `number`  | `0.3`            | Duration of each animation phase in seconds      |
| `once`                    | `boolean` | `false`          | Only transition once (no reverse on mouse leave) |
| `aspect-ratio`            | `string`  | `'100%'`         | Aspect ratio as padding-top percentage           |

## Slots

| Slot     | Description                       |
| -------- | --------------------------------- |
| `first`  | Default visible content           |
| `second` | Content revealed after transition |
