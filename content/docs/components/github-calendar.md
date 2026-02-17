---
title: Github Calendar
description: A premium, customizable visualization of GitHub contribution graphs with multiple color schemes and display variants.
---

::demo-github-calendar
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/github-calendar.json"
```

## Props

| Prop             | Type                                                  | Default     | Description                                           |
| ---------------- | ----------------------------------------------------- | ----------- | ----------------------------------------------------- |
| `username`       | `string`                                              | -           | GitHub username to fetch contributions for (required) |
| `variant`        | `'default' \| 'city-lights' \| 'minimal'`             | `'default'` | Visual style variant                                  |
| `color-schema`   | `'green' \| 'blue' \| 'purple' \| 'orange' \| 'gray'` | `'green'`   | Color scheme for cells                                |
| `show-total`     | `boolean`                                             | `true`      | Show total contributions header                       |
| `shape`          | `'square' \| 'rounded' \| 'circle' \| 'squircle'`     | `'rounded'` | Cell shape                                            |
| `glow-intensity` | `number`                                              | `5`         | Glow intensity for city-lights variant                |
| `class`          | `string`                                              | `''`        | Additional CSS classes                                |
