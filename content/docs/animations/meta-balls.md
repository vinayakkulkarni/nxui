---
title: Meta Balls
description: WebGL 2 metaball shader with cursor-reactive ball and configurable colors.
---

::demo-meta-balls
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/meta-balls.json"
```

## Props

| Prop                       | Type      | Default     | Description                       |
| -------------------------- | --------- | ----------- | --------------------------------- |
| `color`                    | `string`  | `'#ffffff'` | Base color of the metaballs       |
| `speed`                    | `number`  | `0.3`       | Animation speed                   |
| `enable-mouse-interaction` | `boolean` | `true`      | Enable cursor tracking            |
| `hover-smoothness`         | `number`  | `0.05`      | Cursor follow smoothness (0-1)    |
| `animation-size`           | `number`  | `30`        | Scale of the metaball field       |
| `ball-count`               | `number`  | `15`        | Number of metaballs (max 50)      |
| `clump-factor`             | `number`  | `1`         | How tightly balls cluster         |
| `cursor-ball-size`         | `number`  | `3`         | Size of the cursor-following ball |
| `cursor-ball-color`        | `string`  | `'#ffffff'` | Color of the cursor ball          |
| `enable-transparency`      | `boolean` | `true`      | Transparent background            |
