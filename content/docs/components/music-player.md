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

## Usage

```vue
<script setup lang="ts">
  import MusicPlayer from '~/components/ui/music-player/MusicPlayer.vue';
</script>

<template>
  <MusicPlayer
    src="https://www.youtube.com/watch?v=jfKfPfyJRdk"
    cover-art="https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&q=80"
    :auto-play="false"
  />
</template>
```

## Props

| Prop       | Type      | Default  | Description                                  |
| ---------- | --------- | -------- | -------------------------------------------- |
| `src`      | `string`  | required | The source URL of the audio or YouTube video |
| `coverArt` | `string`  | required | The URL of the album cover image             |
| `autoPlay` | `boolean` | `false`  | Whether to auto-play when loaded             |
| `class`    | `string`  | `''`     | Additional CSS classes for styling           |
