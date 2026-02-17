---
title: Tilted Card
description: 3D tilting card that follows cursor with spring damping and tooltip caption.
---

::demo-tilted-card
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/tilted-card.json"
```

## Props

| Prop                  | Type      | Default               | Description                 |
| --------------------- | --------- | --------------------- | --------------------------- |
| `image-src`           | `string`  | `''`                  | Image source URL            |
| `alt-text`            | `string`  | `'Tilted card image'` | Image alt text              |
| `caption-text`        | `string`  | `''`                  | Tooltip caption on hover    |
| `container-height`    | `string`  | `'300px'`             | Container height            |
| `container-width`     | `string`  | `'100%'`              | Container width             |
| `image-height`        | `string`  | `'300px'`             | Image height                |
| `image-width`         | `string`  | `'300px'`             | Image width                 |
| `scale-on-hover`      | `number`  | `1.1`                 | Scale factor on hover       |
| `rotate-amplitude`    | `number`  | `14`                  | Max rotation in degrees     |
| `show-mobile-warning` | `boolean` | `true`                | Show mobile warning message |
| `show-tooltip`        | `boolean` | `true`                | Show cursor tooltip         |
