---
title: Scrambled Text
description: Text that scrambles characters near the cursor with a proximity-based scramble effect.
---

::demo-scrambled-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scrambled-text.json"
```

## Props

| Prop             | Type     | Default         | Description                                                       |
| ---------------- | -------- | --------------- | ----------------------------------------------------------------- |
| `text`           | `string` | —               | The text content to display                                       |
| `radius`         | `number` | `100`           | Pixel radius of the scramble effect around cursor                 |
| `speed`          | `number` | `50`            | Duration in milliseconds for the scramble-to-reveal per character |
| `scramble-chars` | `string` | `'.:!?#*&@^$~'` | Characters used for scrambling                                    |
| `class`          | `string` | —               | Additional CSS classes                                            |
