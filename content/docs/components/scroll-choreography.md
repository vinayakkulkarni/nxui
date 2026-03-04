---
title: Scroll Choreography
description: Scroll-driven image choreography with diagonal movement, stacking, and hero expansion phases.
---

::demo-scroll-choreography
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/scroll-choreography.json"
```

## Props

| Prop     | Type                                                                             | Default | Description                            |
| -------- | -------------------------------------------------------------------------------- | ------- | -------------------------------------- |
| `images` | `{ topLeft: string; topRight: string; bottomLeft: string; bottomRight: string }` | —       | URLs for the four choreographed images |
| `class`  | `string`                                                                         | —       | Additional CSS classes                 |
