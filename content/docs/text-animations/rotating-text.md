---
title: Rotating Text
description: Cycle through an array of text phrases with staggered character enter and exit transitions.
---

::demo-rotating-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/rotating-text.json"
```

## Props

| Prop                | Type                            | Default        | Description                                       |
| ------------------- | ------------------------------- | -------------- | ------------------------------------------------- |
| `texts`             | `string[]`                      | —              | Array of text strings to cycle through            |
| `rotation-interval` | `number`                        | `2000`         | Time in ms between text rotations                 |
| `stagger-duration`  | `number`                        | `0.03`         | Delay between each character animation in seconds |
| `stagger-from`      | `'first' \| 'last' \| 'center'` | `'first'`      | Direction of the stagger effect                   |
| `loop`              | `boolean`                       | `true`         | Loop back to the first text after the last        |
| `auto`              | `boolean`                       | `true`         | Automatically cycle through texts                 |
| `split-by`          | `'characters' \| 'words'`       | `'characters'` | Split text by characters or words                 |
| `class`             | `string`                        | —              | Additional CSS classes                            |
