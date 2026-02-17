---
title: Flowing Menu
description: Hover-activated marquee menu with edge-aware slide-in animation.
---

::demo-flowing-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/flowing-menu.json"
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `FlowingMenuItem[]` | `[]` | Menu items with link, text, image |
| `text-color` | `string` | `'#fff'` | Menu text color |
| `bg-color` | `string` | `'#060010'` | Background color |
| `marquee-bg-color` | `string` | `'#fff'` | Marquee overlay background |
| `marquee-text-color` | `string` | `'#060010'` | Marquee text color |
| `border-color` | `string` | `'#fff'` | Item border color |
| `speed` | `number` | `15` | Marquee animation speed in seconds |
