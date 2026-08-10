<script setup lang="ts">
  import { ref, useId, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import type { ArtGalleryPanel } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      panels?: ArtGalleryPanel[];
      /** Viewport fraction where a line is fully melted (1 = bottom edge). */
      meltStart?: number;
      /** Viewport fraction where a line has fully resolved. */
      meltEnd?: number;
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
          text: 'We collect the paintings that hold their breath. The wine that never spills from a tilted cup, the note that never finishes leaving the reed, the eye that has been watching the same doorway since 1628. Every frame in this room is a single second refusing to end, and we spend our days deciding which of those seconds deserves a wall.',
        },
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Frans_Hals_-_The_Merry_Drinker_-_WGA11095.jpg',
          alt: 'The Merry Drinker — Frans Hals',
        },
        {
          type: 'lines',
          lines: ['The Weight of', 'Old Light'],
        },
        {
          type: 'image',
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/El_Greco_-_The_Burial_of_the_Count_of_Orgaz.JPG/1280px-El_Greco_-_The_Burial_of_the_Count_of_Orgaz.JPG',
          alt: 'The Burial of the Count of Orgaz — El Greco',
        },
      ],
      meltStart: 0.82,
      meltEnd: 0.46,
      class: '',
    },
  );

  const uid = useId().replace(/[^a-z0-9]/gi, '');

  /**
   * Discrete goo filters. Letterforms collapse into blobs at high stdDeviation
   * and snap back to crisp type at 0 — the melt is the transition between them.
   */
  const MELT_LEVELS = [0, 0.8, 1.6, 2.6, 3.6, 4.8, 6.2, 7.8, 9.6];

  const scrollerRef = ref<HTMLElement | null>(null);
  /** Per-line melt level index, keyed by the line's data-melt id. */
  const meltIndex = ref<Record<string, number>>({});

  let raf = 0;

  /**
   * Melt is SCROLL-DRIVEN: a line deep in the lower viewport is fully
   * dissolved and resolves as it rises. Static per-index melt (what this
   * component did before) never changes while scrolling and is wrong.
   */
  function updateMelt() {
    const scroller = scrollerRef.value;
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const h = rect.height || 1;
    const next: Record<string, number> = {};
    const nodes = scroller.querySelectorAll<HTMLElement>('[data-melt]');
    for (const node of nodes) {
      const id = node.dataset.melt ?? '';
      const nodeRect = node.getBoundingClientRect();
      const center = (nodeRect.top + nodeRect.height / 2 - rect.top) / h;
      const span = props.meltStart - props.meltEnd;
      const t =
        span === 0
          ? 0
          : Math.min(1, Math.max(0, (center - props.meltEnd) / span));
      next[id] = Math.round(t * (MELT_LEVELS.length - 1));
    }
    meltIndex.value = next;
  }

  function onScroll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateMelt);
  }

  function meltFilter(id: string): string {
    const level = meltIndex.value[id] ?? MELT_LEVELS.length - 1;
    return level === 0 ? 'none' : `url(#${uid}-melt-${level})`;
  }

  onMounted(async () => {
    await nextTick();
    updateMelt();
    window.addEventListener('resize', onScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onScroll);
  });

  function paragraphLines(text: string): string[] {
    return (text.match(/[^.]+\.?/g) ?? []).map((s) => s.trim()).filter(Boolean);
  }
</script>

<template>
  <div
    ref="scrollerRef"
    :class="
      cn(
        'relative size-full overflow-y-auto overscroll-contain bg-[#f2f1ee] scroll-smooth',
        props.class,
      )
    "
    @scroll.passive="onScroll"
  >
    <svg class="pointer-events-none absolute size-0" aria-hidden="true">
      <defs>
        <filter
          v-for="(std, i) in MELT_LEVELS"
          :id="`${uid}-melt-${i}`"
          :key="i"
          x="-25%"
          y="-60%"
          width="150%"
          height="220%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            :stdDeviation="std"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
          />
        </filter>
      </defs>
    </svg>

    <template v-for="(panel, pi) in panels" :key="pi">
      <!-- full-bleed painting -->
      <img
        v-if="panel.type === 'image'"
        :src="panel.src"
        :alt="panel.alt ?? ''"
        class="block h-105 w-full object-cover"
        loading="lazy"
        @load="onScroll"
      />

      <!-- big melting list -->
      <div
        v-else-if="panel.type === 'lines'"
        class="flex flex-col items-center gap-1 px-6 py-24"
      >
        <p
          v-for="(line, li) in panel.lines"
          :key="line"
          :data-melt="`${pi}-${li}`"
          class="text-center text-5xl font-black tracking-tight text-zinc-950 will-change-[filter] sm:text-6xl"
          :style="{ filter: meltFilter(`${pi}-${li}`) }"
        >
          {{ line }}
        </p>
      </div>

      <!-- melting paragraph -->
      <div v-else class="mx-auto max-w-3xl px-6 py-24">
        <p
          v-for="(line, li) in paragraphLines(panel.text ?? '')"
          :key="li"
          :data-melt="`${pi}-${li}`"
          class="text-center text-2xl/snug font-bold tracking-tight text-zinc-950 will-change-[filter] sm:text-3xl"
          :style="{ filter: meltFilter(`${pi}-${li}`) }"
        >
          {{ line }}
        </p>
      </div>
    </template>
  </div>
</template>
