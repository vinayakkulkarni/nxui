---
title: Click Spark
description: Click-triggered spark burst animation rendered on canvas.
---

::demo-click-spark
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/click-spark.json"
```

## Props

| Prop           | Type     | Default      | Description                       |
| -------------- | -------- | ------------ | --------------------------------- |
| `spark-color`  | `string` | `'#fff'`     | Color of the sparks               |
| `spark-size`   | `number` | `10`         | Length of spark lines             |
| `spark-radius` | `number` | `15`         | Maximum travel radius             |
| `spark-count`  | `number` | `8`          | Number of sparks per click        |
| `duration`     | `number` | `400`        | Animation duration in ms          |
| `easing`       | `string` | `'ease-out'` | Easing function                   |
| `extra-scale`  | `number` | `1.0`        | Scale multiplier for spark radius |
