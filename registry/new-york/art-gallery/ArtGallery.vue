<script setup lang="ts">
  import { useId } from 'vue';
  import type { ArtGalleryPanel } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      panels?: ArtGalleryPanel[];
      class?: string;
    }>(),
    {
      panels: () => [
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Peter_Paul_Rubens_-_Prometheus_Bound.jpg/1920px-Peter_Paul_Rubens_-_Prometheus_Bound.jpg',
          alt: 'Prometheus Bound — Peter Paul Rubens',
        },
        {
          type: 'lines',
          lines: [
            'Ground Pigment',
            'Falling Shadow',
            'Warm Flesh',
            'Suspended Gesture',
            'Held Silence',
          ],
        },
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Night_Watch_-_HD.jpg/1920px-The_Night_Watch_-_HD.jpg',
          alt: 'The Night Watch — Rembrandt',
        },
        {
          type: 'paragraph',
          text: 'We collect the paintings that hold their breath. The wine that never spills from a tilted cup, the note that never finishes leaving the reed, the eye that has been watching the same doorway since the seventeenth century.',
        },
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Frans_Hals_-_The_Merry_Drinker_-_WGA11095.jpg',
          alt: 'The Merry Drinker — Frans Hals',
        },
        {
          type: 'lines',
          lines: ['Tilted Cups', 'Unfinished Notes', 'Patient Eyes'],
        },
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/El_Greco_-_The_Burial_of_the_Count_of_Orgaz.JPG/1280px-El_Greco_-_The_Burial_of_the_Count_of_Orgaz.JPG',
          alt: 'The Burial of the Count of Orgaz — El Greco',
        },
      ],
      class: '',
    },
  );

  const uid = useId().replace(/[^a-z0-9]/gi, '');

  /** Goo strength per line depth: readable first line → dissolved last. */
  const meltLevels = [0.9, 2.2, 3.4, 4.8, 6.4, 8];

  function meltFilter(lineIndex: number, total: number): string {
    const t = total <= 1 ? 0 : lineIndex / (total - 1);
    const level = Math.min(
      meltLevels.length - 1,
      Math.round(t * (meltLevels.length - 1)),
    );
    return `url(#${uid}-melt-${level})`;
  }
</script>

<template>
  <div
    :class="
      cn(
        'relative size-full overflow-y-auto overscroll-contain bg-[#f2f1ee]',
        props.class,
      )
    "
  >
    <!--
      Gooey melt: blur + alpha-contrast collapses letterforms into blobs.
      One filter per intensity step; lines deeper in a block melt harder.
    -->
    <svg class="pointer-events-none absolute size-0" aria-hidden="true">
      <defs>
        <filter
          v-for="(std, i) in meltLevels"
          :id="`${uid}-melt-${i}`"
          :key="i"
          x="-20%"
          y="-40%"
          width="140%"
          height="180%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            :stdDeviation="std"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
          />
        </filter>
      </defs>
    </svg>

    <template v-for="(panel, pi) in panels" :key="pi">
      <!-- full-bleed painting -->
      <div v-if="panel.type === 'image'" class="w-full">
        <img
          :src="panel.src"
          :alt="panel.alt ?? ''"
          class="block h-105 w-full object-cover"
          loading="lazy"
        />
      </div>

      <!-- big melting list -->
      <div
        v-else-if="panel.type === 'lines'"
        class="flex flex-col items-center gap-1 px-6 py-16"
      >
        <p
          v-for="(line, li) in panel.lines"
          :key="line"
          class="text-center text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl"
          :style="{ filter: meltFilter(li, panel.lines!.length) }"
        >
          {{ line }}
        </p>
      </div>

      <!-- melting paragraph -->
      <div v-else class="mx-auto max-w-3xl px-6 py-16">
        <p
          v-for="(line, li) in (panel.text ?? '').match(/[^.]+\.?/g) ?? []"
          :key="li"
          class="text-center text-2xl/snug font-bold tracking-tight text-zinc-950 sm:text-3xl"
          :style="{
            filter: meltFilter(
              li,
              ((panel.text ?? '').match(/[^.]+\.?/g) ?? []).length,
            ),
          }"
        >
          {{ line.trim() }}
        </p>
      </div>
    </template>
  </div>
</template>
