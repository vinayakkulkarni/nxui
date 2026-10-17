---
title: Pill Nav
description: A pill navigation bar where a fill rises through each link as its label rolls over, with a sliding active dot, a gliding pill option and a menu that folds in on small screens.
---

A pill navigation bar. Hover a link and a circle rises through it while the label rolls over. A small dot slides to the current page. Switch to the glide effect to slide one pill between links instead. When the links no longer fit, they fold into a menu button that opens a panel.

::demo-pill-nav
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/pill-nav.json"
```

## Usage

```vue
<script setup lang="ts">
  import PillNav from '~/components/ui/pill-nav/PillNav.vue';
  import type { PillNavItem } from '~/components/ui/pill-nav/types';

  const items: PillNavItem[] = [
    { label: 'Home', href: '/', icon: 'lucide:house' },
    { label: 'Journal', href: '/journal' },
    { label: 'Photos', href: '/photos' },
    { label: 'About', href: '/about' },
  ];
</script>

<template>
  <PillNav
    logo="/logo.svg"
    logo-alt="Acme"
    :items="items"
    active-href="/"
    theme="dark"
    hover-effect="fill"
    indicator="dot"
  />
</template>
```

Pass a router link with `link-component` (for example `:link-component="NuxtLink"`). Use the `logo` slot instead of `logo` to render your own mark.

## Props

| Prop                   | Type                            | Default   | Description                                                                                                |
| ---------------------- | ------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `items`                | `PillNavItem[]`                 | 4 samples | The navigation links. Items without an `href` render as buttons.                                           |
| `logo`                 | `string`                        | —         | Image URL shown in the round logo button. It spins on hover.                                               |
| `logo-alt`             | `string`                        | `'Logo'`  | Accessible label for the logo link.                                                                        |
| `logo-href`            | `string`                        | `'#'`     | Where the logo links to.                                                                                   |
| `active-href`          | `string`                        | —         | Marks the item with this href as the current page. Leave it out to let the nav track clicks itself.        |
| `default-active-index` | `number`                        | `0`       | Which item starts active when `active-href` is not set.                                                    |
| `link-component`       | `string \| Component`           | `'a'`     | Renders the links, so you can pass your router's link. It receives `href`, `class` and children.           |
| `theme`                | `'dark' \| 'light'`             | `'dark'`  | Color scheme of the surfaces, labels and highlight.                                                        |
| `layout`               | `'split' \| 'joined'`           | `'split'` | Split puts the logo in its own bubble beside the bar. Joined holds everything in one capsule.              |
| `item-style`           | `'pill' \| 'plain'`             | `'pill'`  | Pill gives every item its own raised pill. Plain shows the labels straight on the bar.                     |
| `hover-effect`         | `'fill' \| 'glide' \| 'none'`   | `'fill'`  | Fill rises a circle through the hovered pill as its label rolls over. Glide slides one pill to the cursor. |
| `indicator`            | `'dot' \| 'pill' \| 'none'`     | `'dot'`   | How the current page is marked: a dot that slides between items, or a filled pill.                         |
| `surface`              | `'glass' \| 'solid' \| 'none'`  | `'glass'` | Background of the bar and logo: frosted glass, an opaque fill, or nothing.                                 |
| `size`                 | `'sm' \| 'md' \| 'lg'`          | `'md'`    | Height, padding and text size.                                                                             |
| `highlight-color`      | `string`                        | —         | Color of the fill, the gliding pill and the dot. Labels on it pick black or white for contrast.            |
| `highlight-text-color` | `string`                        | —         | Overrides the label color on the highlight.                                                                |
| `bar-color`            | `string`                        | —         | Overrides the background of the bar and logo.                                                              |
| `text-color`           | `string`                        | —         | Overrides the label color.                                                                                 |
| `bounce`               | `number`                        | `0.3`     | How much the gliding pill and the dot overshoot as they settle, from 0 to 1.                               |
| `stretch`              | `number`                        | `0.5`     | How far the gliding pill stretches toward its target before the back edge catches up, from 0 to 1.         |
| `collapse`             | `'auto' \| 'always' \| 'never'` | `'auto'`  | When the links fold into a menu button. Auto folds them only when they no longer fit.                      |
| `intro`                | `boolean`                       | `true`    | Pops the logo in and unrolls the bar on mount.                                                             |
| `aria-label`           | `string`                        | `'Main'`  | Accessible name of the nav landmark.                                                                       |
| `class`                | `string`                        | `''`      | Extra classes for the nav.                                                                                 |

### PillNavItem

| Field       | Type     | Description                               |
| ----------- | -------- | ----------------------------------------- |
| `label`     | `string` | Display text                              |
| `href`      | `string` | Link URL. Leave it out to render a button |
| `icon`      | `string` | Iconify name, e.g. `lucide:house`         |
| `ariaLabel` | `string` | Accessible name                           |

## Events

| Event         | Payload                                                 | Description                                 |
| ------------- | ------------------------------------------------------- | ------------------------------------------- |
| `item-click`  | `(item: PillNavItem, index: number, event: MouseEvent)` | Fired when an item is clicked.              |
| `menu-toggle` | `(open: boolean)`                                       | Fired when the folded menu opens or closes. |

## Slots

| Slot   | Description                                                 |
| ------ | ----------------------------------------------------------- |
| `logo` | Custom content for the round logo button (replaces `logo`). |

## Accessibility

- Renders a `<nav>` landmark named by `aria-label`. The current item gets `aria-current="page"`.
- Every link is a real `<a>` (or `<button>` without `href`) with a visible focus ring. Keyboard focus also moves the gliding pill.
- The menu button exposes `aria-expanded` and `aria-controls`. Escape and clicks outside close the menu; Escape returns focus to the button.
- With `prefers-reduced-motion: reduce`, the intro, springs and roll transitions are switched off.

- Ported from [React Bits](https://reactbits.dev/components/pill-nav) by David Haz.
