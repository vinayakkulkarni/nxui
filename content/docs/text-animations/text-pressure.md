---
title: Text Pressure
description: Variable font text that responds to cursor proximity with weight, width, and italic axis changes.
---

::demo-text-pressure
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-pressure.json"
```

## Props

| Prop            | Type      | Default          | Description                           |
| --------------- | --------- | ---------------- | ------------------------------------- |
| `text`          | `string`  | —                | The text content to display           |
| `font-family`   | `string`  | `'Compressa VF'` | Variable font family name             |
| `font-url`      | `string`  | Compressa URL    | URL to the variable font file         |
| `width`         | `boolean` | `true`           | Animate the `wdth` axis               |
| `weight`        | `boolean` | `true`           | Animate the `wght` axis               |
| `italic`        | `boolean` | `true`           | Animate the `ital` axis               |
| `alpha`         | `boolean` | `false`          | Vary character opacity with proximity |
| `flex`          | `boolean` | `true`           | Use flex layout to space characters   |
| `stroke`        | `boolean` | `false`          | Add stroke outline effect             |
| `text-color`    | `string`  | `'currentColor'` | Text color                            |
| `min-font-size` | `number`  | `24`             | Minimum font size in pixels           |
| `class`         | `string`  | —                | Additional CSS classes                |
