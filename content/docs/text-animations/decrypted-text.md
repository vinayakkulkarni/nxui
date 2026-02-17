---
title: Decrypted Text
description: Hacker-style text decryption effect that scrambles characters before revealing the original text.
---

::demo-decrypted-text
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/decrypted-text.json"
```

## Props

| Prop               | Type                           | Default            | Description                                           |
| ------------------ | ------------------------------ | ------------------ | ----------------------------------------------------- |
| `text`             | `string`                       | —                  | The text content to decrypt                           |
| `speed`            | `number`                       | `50`               | Milliseconds between each scramble step               |
| `max-iterations`   | `number`                       | `10`               | Max scramble iterations (non-sequential mode)         |
| `sequential`       | `boolean`                      | `true`             | Reveal characters one by one instead of all at once   |
| `reveal-direction` | `'start' \| 'end' \| 'center'` | `'start'`          | Direction of sequential reveal                        |
| `characters`       | `string`                       | `'A-Z...!@#$%...'` | Character set used for scrambling                     |
| `animate-on`       | `'view' \| 'hover' \| 'both'`  | `'hover'`          | Trigger animation on hover, scroll into view, or both |
| `class`            | `string`                       | —                  | Additional CSS classes                                |
| `encrypted-class`  | `string`                       | —                  | CSS classes for unresolved scrambled characters       |
