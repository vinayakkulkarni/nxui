---
title: Text Cursor
description: A cursor trail effect that drops text or emoji characters along the mouse path, with configurable spacing and fade.
---

::demo-text-cursor
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-cursor.json"
```

## Props

| Prop                     | Type      | Default | Description                                     |
| ------------------------ | --------- | ------- | ----------------------------------------------- |
| `text`                   | `string`  | `'⚛️'`  | Text or emoji to display as cursor trail        |
| `spacing`                | `number`  | `100`   | Minimum pixel distance between trail items      |
| `follow-mouse-direction` | `boolean` | `true`  | Rotate trail items to follow cursor direction   |
| `random-float`           | `boolean` | `true`  | Add subtle random floating motion               |
| `exit-duration`          | `number`  | `0.5`   | Fade-out duration in seconds                    |
| `removal-interval`       | `number`  | `30`    | Milliseconds between removing stale trail items |
| `max-points`             | `number`  | `5`     | Maximum number of trail items visible           |
| `class`                  | `string`  | —       | Additional CSS classes                          |
