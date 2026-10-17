---
title: Bubble Menu
description: Floating circular expanding menu with staggered item reveal.
---

A logo bubble and a round menu button float at the top of their container. Click the button and the links pop in as large tilted pills, one after another, each label sliding up as its bubble grows. Hover a pill to tint it. Click the button again and everything shrinks away.

::demo-bubble-menu
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/bubble-menu.json"
```

## Usage

```vue
<script setup lang="ts">
  import { BubbleMenu } from '~/components/ui/bubble-menu';
  import type { BubbleMenuItem } from '~/components/ui/bubble-menu';

  const items: BubbleMenuItem[] = [
    {
      label: 'home',
      href: '/',
      rotation: -8,
      hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' },
    },
    {
      label: 'about',
      href: '/about',
      rotation: 8,
      hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' },
    },
  ];

  function onMenuClick(open: boolean) {
    console.log('menu open', open);
  }
</script>

<template>
  <div class="relative h-200 w-full">
    <BubbleMenu
      logo="/logo.svg"
      :items="items"
      animation-ease="back.out(1.5)"
      @menu-click="onMenuClick"
    />
  </div>
</template>
```

The menu is positioned `absolute` inside its nearest positioned parent. Set `use-fixed-position` to pin it to the viewport instead.

## Props

| Prop                 | Type               | Default           | Description                                                                                            |
| -------------------- | ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `logo`               | `string`           | `''`              | Image URL for the logo bubble. Use the `logo` slot for markup.                                         |
| `menu-aria-label`    | `string`           | `'Toggle menu'`   | Accessible label for the menu button.                                                                  |
| `menu-bg`            | `string`           | `'#fff'`          | Background of the logo and menu bubbles, and the base pill color.                                      |
| `menu-content-color` | `string`           | `'#111'`          | Color of the menu icon lines and the pill text.                                                        |
| `use-fixed-position` | `boolean`          | `false`           | Positions the menu with `fixed` instead of `absolute`.                                                 |
| `items`              | `BubbleMenuItem[]` | 5 sample links    | `label`, `href`, `ariaLabel?`, `rotation?`, `hoverStyles?: { bgColor?, textColor? }`.                  |
| `animation-ease`     | `BubbleMenuEase`   | `'back.out(1.5)'` | Bubble scale-in ease: `back.out(1.5)`, `power3.out`, `power2.out`, `elastic.out(1,0.5)`, `bounce.out`. |
| `animation-duration` | `number`           | `0.5`             | Duration of each bubble and label animation, in seconds.                                               |
| `stagger-delay`      | `number`           | `0.12`            | Base delay between bubbles, in seconds, with a slight random variance.                                 |
| `class`              | `string`           | `''`              | Extra classes for the nav wrapper.                                                                     |

## Events / Slots

| API          | Payload         | Description                                      |
| ------------ | --------------- | ------------------------------------------------ |
| `menu-click` | `open: boolean` | Fired whenever the menu button is toggled.       |
| `#logo`      | —               | Custom logo markup in place of the `logo` image. |

## Accessibility

- The menu button exposes `aria-pressed` and a configurable `aria-label`. The links render as a `role="menu"` list of `menuitem` anchors with visible focus rings.
- Pills tilt only on viewports 900px and wider; on smaller screens they stack full width.
- With `prefers-reduced-motion: reduce`, the pills appear and disappear without scaling.

- Ported from [React Bits](https://reactbits.dev/components/bubble-menu) by David Haz.
