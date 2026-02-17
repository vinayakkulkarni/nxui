---
title: Shuffle
description: Animated text reveal where characters shuffle through random glyphs before settling into place.
---

::demo-shuffle
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/shuffle.json"
```

## Props

| Prop         | Type     | Default                                                                    | Description                              |
| ------------ | -------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| `text`       | `string` | —                                                                          | The text to reveal through shuffling     |
| `duration`   | `number` | `800`                                                                      | Total animation duration in milliseconds |
| `characters` | `string` | `'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'` | Character pool for shuffling             |
| `class`      | `string` | —                                                                          | Additional CSS classes for styling       |
