---
title: Bubble Menu
description: Animated full-screen pill navigation with staggered scale-in and rotation.
---

::demo-bubble-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bubble-menu.json"
```

## Props

| Prop               | Type             | Default    | Description                       |
| ------------------ | ---------------- | ---------- | --------------------------------- |
| items              | BubbleMenuItem[] | 5 defaults | Navigation items                  |
| menu-bg            | string           | '#ffffff'  | Background color for menu bubbles |
| menu-content-color | string           | '#111111'  | Text/icon color                   |
| animation-duration | number           | 500        | Animation duration in ms          |
| stagger-delay      | number           | 80         | Delay between each item in ms     |

## BubbleMenuItem

| Prop           | Type   | Description               |
| -------------- | ------ | ------------------------- |
| label          | string | Display text              |
| href           | string | Link URL                  |
| rotation       | number | Tilt angle in degrees     |
| hoverBgColor   | string | Background color on hover |
| hoverTextColor | string | Text color on hover       |
