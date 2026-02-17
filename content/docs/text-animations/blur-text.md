---
title: Blur Text
description: Words or letters animate from blurred to clear with a staggered entrance, triggered on scroll into view.
---

::demo-blur-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/blur-text.json"
```

## Props

| Prop        | Type                   | Default   | Description                                    |
| ----------- | ---------------------- | --------- | ---------------------------------------------- |
| `text`      | `string`               | —         | The text content to animate                    |
| `delay`     | `number`               | `200`     | Stagger delay between segments in milliseconds |
| `by`        | `'words' \| 'letters'` | `'words'` | Split by words or individual letters           |
| `direction` | `'top' \| 'bottom'`    | `'top'`   | Direction of the entrance animation            |
| `threshold` | `number`               | `0.1`     | Intersection observer threshold                |
| `duration`  | `number`               | `0.35`    | Animation duration for each segment in seconds |
| `class`     | `string`               | —         | Additional CSS classes                         |
