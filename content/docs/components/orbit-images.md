---
title: Orbit Images
description: Images orbiting in a circular path with smooth rAF animation and configurable speed.
---

::demo-orbit-images
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/orbit-images.json"
```

## Props

| Prop           | Type          | Default | Description                |
| -------------- | ------------- | ------- | -------------------------- |
| `images`       | `OrbitItem[]` | `[]`    | Array of image objects     |
| `orbit-radius` | `number`      | `160`   | Radius of the orbit circle |
| `item-size`    | `number`      | `60`    | Size of each image         |
| `speed`        | `number`      | `20`    | Rotation speed             |
| `show-path`    | `boolean`     | `true`  | Show the orbit path ring   |
| `reverse`      | `boolean`     | `false` | Reverse rotation direction |
