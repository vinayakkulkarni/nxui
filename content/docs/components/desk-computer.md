---
title: Desk Computer
description: An isometric late-90s desk computer you can use. Type into its CRT, drag its mouse, load its CD and switch its screen off and on.
---

# Desk Computer

An isometric late-90s desk computer drawn as one line-art SVG: a CRT on a swivel base showing a browser with a search box, a mid-tower with a CD-ROM and floppy drive, a 104-key keyboard, a ball mouse on its pad, a speaker and a CD-R in its jewel case. Focus it and type: the keys go down and the text lands in the search box, and Enter searches while the hard-drive LED flickers. Drag the mouse around its pad and its cable follows while the cursor moves on the screen. Click the jewel case and the tray slides out, the disc flies in and AutoPlay opens; click the drive to eject it. Escape or the monitor's power button collapses the picture to a line and a dot. It assembles itself on arrival and on every theme change, and while nobody touches it, it gives itself a tour.

::demo-desk-computer
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/desk-computer.json"
```

The drawing is about 490 KB of SVG, so it is fetched at mount instead of shipped in your bundle. Save [desk-computer.svg](https://nxui.geoql.in/library/desk-computer.svg) to `public/library/desk-computer.svg`, or point `src` at wherever you serve it.

## Usage

```vue
<script setup lang="ts">
  import { computed } from 'vue';
  import DeskComputer from '~/components/ui/desk-computer/DeskComputer.vue';

  const colorMode = useColorMode();
  const theme = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'));
</script>

<template>
  <DeskComputer :theme="theme" src="/library/desk-computer.svg" />
</template>
```

Without `fill` it keeps the drawing's own 1000:760 shape at the width of its container. With `fill` it covers its container edge to edge and centres the figure in it.

## Props

| Prop    | Type                | Default                        | Description                                                                                                  |
| ------- | ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `theme` | `'light' \| 'dark'` | `'light'`                      | Colour theme. Changing it replays the assembly.                                                              |
| `sound` | `boolean`           | `true`                         | Synthesised key clicks, CRT power-on hum and power-off zap. Only your own input makes sound, never the tour. |
| `fill`  | `boolean`           | `false`                        | Fill the container edge to edge instead of keeping the 1000:760 shape.                                       |
| `src`   | `string`            | `'/library/desk-computer.svg'` | Where the drawing is served from.                                                                            |
| `class` | `string`            | `''`                           | Extra classes for the root element.                                                                          |

## Interactions

| Input                         | Effect                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| Type a character              | The key goes down and the character lands in the search box.                |
| Backspace                     | Deletes the last character.                                                 |
| Enter                         | Searches: the box clears and the hard-drive LED flickers.                   |
| Escape, or the monitor button | Switches the screen off (collapse to a line and a dot) or on (warm-up).     |
| Caps Lock                     | Toggles the keyboard's Caps Lock LED.                                       |
| Click a key on the drawing    | Presses that key.                                                           |
| Drag the mouse                | The mouse slides on its pad, the cable follows, the cursor moves on screen. |
| Click the mouse               | Clicks where the cursor is: focuses the search box or closes AutoPlay.      |
| Click the jewel case          | The tray opens, the disc flies in, the tray shuts and AutoPlay appears.     |
| Click the drive               | Ejects the disc back to its case, or opens and shuts an empty tray.         |

The tour stops on your first input and resumes after nine quiet seconds.

## Accessibility

- The stage is a focusable `role="group"` with a label that lists the controls. It takes keys while focused and shows a dashed focus ring for keyboard users; the ring hides once you use a pointer.
- A polite `role="status"` live region announces what happened: "Screen on.", "Searching for …", "Loading the CD.", "AutoPlay: CD-R in drive D.", "Ejecting the CD."
- Sound needs a user gesture. The audio context is created on your first key or press, and the tour never makes a sound.
- With reduced motion the assembly, the caret blink and the tour are off, and every move jumps to its end.
- The animation loop only runs while something moves and the figure is on screen.

Ported from [Desk Computer](https://pinui.xyz/components/desk-computer) by Pin UI, MIT licence.
