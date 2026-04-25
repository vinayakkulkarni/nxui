---
title: Music Player
description: An interactive vinyl-record music player with swinging tonearm and animated rotation.
---

::demo-music-player
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/music-player.json"
```

## Props

| Prop       | Type      | Default  | Description                                  |
| ---------- | --------- | -------- | -------------------------------------------- |
| `src`      | `string`  | required | The source URL of the audio or YouTube video |
| `coverArt` | `string`  | required | The URL of the album cover image             |
| `autoPlay` | `boolean` | `false`  | Whether to auto-play when loaded             |
| `class`    | `string`  | `''`     | Additional CSS classes for styling           |
