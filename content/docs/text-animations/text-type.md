---
title: Text Type
description: Typewriter effect with character-by-character typing, optional delete-and-retype loop, and blinking cursor.
---

::demo-text-type
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/text-type.json"
```

## Props

| Prop               | Type                 | Default | Description                                       |
| ------------------ | -------------------- | ------- | ------------------------------------------------- |
| `text`             | `string \| string[]` | —       | Single string or array of strings to type through |
| `typing-speed`     | `number`             | `50`    | Milliseconds between typing each character        |
| `deleting-speed`   | `number`             | `30`    | Milliseconds between deleting each character      |
| `pause-duration`   | `number`             | `2000`  | Milliseconds to pause after typing a full string  |
| `loop`             | `boolean`            | `true`  | Whether to loop through the text array            |
| `show-cursor`      | `boolean`            | `true`  | Show the blinking cursor                          |
| `cursor-character` | `string`             | `'\|'`  | Character used for the cursor                     |
| `start-on-view`    | `boolean`            | `true`  | Start typing only when visible in viewport        |
| `class`            | `string`             | —       | Additional CSS classes                            |
