---
title: Podcast Player
description: Expandable podcast episode card driving a real audio element — waveform seek bar with hover scrubber, chapter chips, speed cycling, volume, and a compact pill mode. Dark and light mode, fully responsive.
---

::demo-podcast-player
::

## Installation

```bash
npx shadcn-vue@latest add "https://nxui.geoql.in/r/podcast-player.json"
```

## Usage

```vue
<script setup lang="ts">
  import PodcastPlayer from '~/components/ui/podcast-player/PodcastPlayer.vue';

  const chapters = [
    { time: 0, label: 'Cold open' },
    { time: 156, label: 'Indicator #1: The vibe' },
    { time: 372, label: 'Indicator #2: Rate cuts' },
  ];
</script>

<template>
  <PodcastPlayer
    src="/audio/episode.mp3"
    title="Indicators of the Year"
    show="Planet Money"
    date="12/31/2025"
    rating="4.6"
    rating-count="30K"
    :meta="['Business', 'Updated daily']"
    description="Our favorite economic indicators of the year, ranked and roasted."
    :chapters="chapters"
    accent="#f4502c"
  />
</template>
```

The player drives a real `HTMLAudioElement`: click the waveform to seek (with
a hover time scrubber), cycle playback speed through 1x/1.25x/1.5x/2x, drag
the volume slider, and jump between chapters. The minimize button collapses
the card into a compact pill with a mini waveform and an Open button.
Follow/save actions confirm with a small toast. Uses shadcn theme tokens
(`card`, `border`, `muted`, `popover`) so it adapts to dark and light mode,
and the layout is responsive down to small screens.

## Props

| Prop           | Type               | Default     | Description                                       |
| -------------- | ------------------ | ----------- | ------------------------------------------------- |
| `src`          | `string`           | —           | Audio file URL                                    |
| `title`        | `string`           | —           | Episode title                                     |
| `show`         | `string`           | —           | Show / channel name                               |
| `date`         | `string`           | `''`        | Release date string                               |
| `rating`       | `string`           | `''`        | Star rating (e.g. `4.6`)                          |
| `rating-count` | `string`           | `''`        | Rating count (e.g. `30K`)                         |
| `meta`         | `string[]`         | `[]`        | Meta segments (e.g. `['Business']`)               |
| `description`  | `string`           | `''`        | Episode description                               |
| `chapters`     | `PodcastChapter[]` | `[]`        | Chapter markers (`{ time, label }`)               |
| `accent`       | `string`           | `'#f4502c'` | Accent color for waveform, play icon, and toggles |
| `bars`         | `number`           | `96`        | Number of waveform bars                           |

## Events

| Event   | Payload | Description          |
| ------- | ------- | -------------------- |
| `play`  | —       | Playback started     |
| `pause` | —       | Playback paused      |
| `ended` | —       | Playback reached end |

## Credits

Ported from the "Podcast player (dark mode)" exploration by
[@disarto_max](https://x.com/disarto_max/status/2074543495407153193),
extended with light-mode support and responsive layout.
