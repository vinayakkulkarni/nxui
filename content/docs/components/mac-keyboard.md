---
title: Mac Keyboard
description: An interactive Mac keyboard with real key tracking, sound effects, and visual feedback. Press keys on your keyboard to see them light up.
---

::demo-mac-keyboard
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/mac-keyboard.json"
```

## Props

### MacKeyboard

| Prop        | Type     | Default                  | Description                              |
| ----------- | -------- | ------------------------ | ---------------------------------------- |
| `sound-src` | `string` | `'/audio/key-press.wav'` | URL to the key press sound effect        |
| `class`     | `string` | `''`                     | Additional CSS classes for the container |

### MacKeyboardKey

| Prop              | Type      | Default | Description                              |
| ----------------- | --------- | ------- | ---------------------------------------- |
| `label`           | `string`  | `''`    | Key label text                           |
| `sub-label`       | `string`  | `''`    | Secondary label (e.g. shifted character) |
| `icon`            | `string`  | `''`    | Icon name for @nuxt/icon                 |
| `icon-label`      | `string`  | `''`    | Text label below the icon                |
| `width`           | `number`  | `1`     | Relative width of the key                |
| `key-code`        | `string`  | `''`    | KeyboardEvent.code to match              |
| `no-aspect-ratio` | `boolean` | `false` | Disable square aspect ratio (for arrows) |
