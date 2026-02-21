---
title: Image Trail
description: Mouse-following image trail that spawns images at cursor position with fade and scale animations.
---

::demo-image-trail
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/image-trail.json"
```

## Props

| Prop                | Type       | Default | Description                        |
| ------------------- | ---------- | ------- | ---------------------------------- |
| `images`            | `string[]` | `[]`    | Array of image URLs                |
| `image-width`       | `number`   | `190`   | Width of trail images              |
| `image-height`      | `number`   | `209`   | Height of trail images             |
| `sensitivity`       | `number`   | `80`    | Mouse distance to spawn next image |
| `fade-out-duration` | `number`   | `1200`  | Fade out duration in ms            |
| `rotation-range`    | `number`   | `15`    | Random rotation range in degrees   |
