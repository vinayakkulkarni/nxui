---
title: Staggered Menu
description: Full-screen staggered menu with animated text cycling, gradient backgrounds, and social links.
---

::demo-staggered-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/staggered-menu.json"
```

## Props

| Prop                        | Type           | Default                      | Description                           |
| --------------------------- | -------------- | ---------------------------- | ------------------------------------- |
| `position`                  | `'left' \| 'right'` | `'right'`              | Menu open direction                   |
| `colors`                    | `string[]`     | `['#B19EEF', '#5227FF']`    | Gradient colors                       |
| `items`                     | `MenuItem[]`   | `[]`                         | Menu items                            |
| `social-items`              | `SocialItem[]` | `[]`                         | Social links                          |
| `display-socials`           | `boolean`      | `true`                       | Show social links                     |
| `display-item-numbering`    | `boolean`      | `true`                       | Show item numbers                     |
| `menu-button-color`         | `string`       | `'#fff'`                     | Hamburger button color                |
| `open-menu-button-color`    | `string`       | `'#fff'`                     | Close button color when open          |
| `accent-color`              | `string`       | `'#5227FF'`                  | Accent color                          |
| `change-menu-color-on-open` | `boolean`      | `true`                       | Change button color when open         |
| `is-fixed`                  | `boolean`      | `false`                      | Fixed position                        |
| `close-on-click-away`       | `boolean`      | `true`                       | Close when clicking outside           |
