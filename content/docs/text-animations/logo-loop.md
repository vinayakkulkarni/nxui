---
title: Logo Loop
description: Draggable looping marquee of logos with a soft transparent fade, an intro, wave, arc and 3D orbit paths, a center lens, dock-style magnify, stepping, labels and tilt.
---

A seamless, endless strip of brand or tech logos. Hover it to pause, drag or swipe it to fling it, and tab through the links to bring each one into view. Pick a path (line, wave, arc or orbit), add a center lens or dock-style magnify, or step one logo at a time.

::demo-logo-loop
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/logo-loop.json"
```

## Usage

```vue
<script setup lang="ts">
  import { LogoLoop } from '~/components/ui/logo-loop';
  import type { LogoItem } from '~/components/ui/logo-loop';

  const logos: LogoItem[] = [
    {
      icon: 'simple-icons:vuedotjs',
      title: 'Vue',
      href: 'https://vuejs.org',
      hoverColor: '#42b883',
    },
    { icon: 'simple-icons:nuxtdotjs', title: 'Nuxt', href: 'https://nuxt.com' },
    { src: '/logos/acme.svg', alt: 'Acme', href: 'https://acme.com' },
  ];
</script>

<template>
  <div class="relative h-50 w-full overflow-hidden">
    <LogoLoop
      :logos="logos"
      :speed="100"
      :logo-height="48"
      :gap="56"
      :hover-speed="0"
      layout="wave"
      labels="hover"
      scale-on-hover
      aria-label="Our tech stack"
    />
  </div>
</template>
```

Each logo is either `{ icon }` (any Iconify name, rendered with `<Icon>`) or `{ src, alt }` for an image. Both take an optional `title`, `href` and `hoverColor`. The fade is a mask, not a colored overlay, so it works on any background. Vertical loops (`direction="up"` or `"down"`) take the height of their parent.

## Props

| Prop             | Type                                       | Default           | Description                                                                                                 |
| ---------------- | ------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `logos`          | `LogoItem[]`                               | required          | Logos to show: `{ icon }` or `{ src, alt }`, each with optional `title`, `href` and `hover-color`.          |
| `speed`          | `number`                                   | `120`             | Speed in pixels per second. Negative values reverse the direction.                                          |
| `direction`      | `'left' \| 'right' \| 'up' \| 'down'`      | `'left'`          | Which way the logos travel.                                                                                 |
| `width`          | `number \| string`                         | `'100%'`          | Width of the loop.                                                                                          |
| `logo-height`    | `number`                                   | `28`              | Height of each logo in pixels.                                                                              |
| `gap`            | `number`                                   | `32`              | Space between logos in pixels.                                                                              |
| `hover-speed`    | `number`                                   | `undefined`       | Speed while hovered or while a logo has keyboard focus. `0` pauses, a small value slows. Pauses by default. |
| `pause-on-hover` | `boolean`                                  | `undefined`       | Set to `false` to keep full speed on hover. Ignored when `hover-speed` is set.                              |
| `fade-out`       | `boolean`                                  | `true`            | Fades the logos out softly at both ends with a transparent mask.                                            |
| `fade-out-width` | `number`                                   | `0.12`            | Size of each fade as a fraction of the length, from 0 to 0.5.                                               |
| `scale-on-hover` | `boolean`                                  | `false`           | Grows the hovered logo slightly.                                                                            |
| `layout`         | `'line' \| 'wave' \| 'arc' \| 'orbit'`     | `'line'`          | Path the logos travel along: a line, a wave, an arc, or a ring that turns in 3D.                            |
| `bend`           | `number`                                   | `0.5`             | How strongly the path bends, from -1 to 1 (wave height, arc curve, orbit tilt). Negative flips it.          |
| `focus`          | `number`                                   | `0`               | A center lens, from 0 to 1. Logos grow and make room as they pass the center; outer ones dim.               |
| `magnify`        | `number`                                   | `0`               | Dock-style magnify under the cursor, from 0 to 1. Nearby logos move aside.                                  |
| `tilt-x`         | `number`                                   | `0`               | Tilts the loop back or forward in 3D, in degrees.                                                           |
| `tilt-y`         | `number`                                   | `0`               | Turns the loop to the side in 3D, in degrees.                                                               |
| `step`           | `boolean`                                  | `false`           | Moves one logo at a time and pauses, centering each in turn. `speed` sets the pace.                         |
| `muted`          | `number`                                   | `0`               | Greys out and dims logos until one is hovered or centered, from 0 to 1.                                     |
| `labels`         | `'none' \| 'inline' \| 'below' \| 'hover'` | `'none'`          | Shows each title beside the logo, below it, or as a caption on hover or when centered.                      |
| `draggable`      | `boolean`                                  | `true`            | Drag or swipe the loop and fling it. Links still open with a normal click.                                  |
| `scroll-boost`   | `number`                                   | `0`               | Speeds the loop up while the page scrolls and reverses it when scrolling up, from 0 to 1.                   |
| `intro`          | `boolean`                                  | `true`            | Logos fade and rise in from left to right the first time the loop comes into view.                          |
| `aria-label`     | `string`                                   | `'Partner logos'` | Accessible name for the loop region.                                                                        |
| `class`          | `string`                                   | `''`              | Extra classes for the container.                                                                            |

## Slots

| Slot   | Props                   | Description                                                                  |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| `item` | `{ item, index, copy }` | Replaces the default icon or image for each logo (React Bits' `renderItem`). |

## Accessibility

- The loop is a labelled `region` containing a list. Only one copy of the list is exposed to assistive tech; the repeats are `aria-hidden` and their links are removed from the tab order.
- Keyboard focus on a link pauses the loop and glides that logo into view; the focus ring uses `currentColor`.
- A drag never triggers a link click; a plain click still opens it.
- With `prefers-reduced-motion: reduce` the loop stops, the intro is skipped and transitions are disabled.

- Ported from [React Bits](https://reactbits.dev/animations/logo-loop) by David Haz.
