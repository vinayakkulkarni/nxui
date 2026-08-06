<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import type { Artwork } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      artworks?: Artwork[];
      autoplayInterval?: number;
      class?: string;
    }>(),
    {
      artworks: () => [
        {
          title: 'Ground Pigment',
          caption: 'The first coat, still wet enough to dream.',
          image:
            'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1200&auto=format&fit=crop',
        },
        {
          title: 'Falling Shadow',
          caption: 'A body of light, caught between two rooms.',
          image:
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200&auto=format&fit=crop',
        },
        {
          title: 'Warm Flesh',
          caption: 'The wine that never spills from a tilted cup.',
          image:
            'https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=1200&auto=format&fit=crop',
        },
        {
          title: 'Suspended Gesture',
          caption: 'The note that never finishes leaving the reed.',
          image:
            'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&auto=format&fit=crop',
        },
        {
          title: 'Held Silence',
          caption: 'The eye that has watched the same doorway since.',
          image:
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop',
        },
      ],
      autoplayInterval: 4000,
      class: '',
    },
  );

  const active = ref(0);
  const featured = computed(() => props.artworks[active.value]!);

  function selectArtwork(index: number) {
    active.value = index;
  }

  let timer = 0;
  function startAutoplay() {
    stopAutoplay();
    if (!props.autoplayInterval) return;
    timer = window.setInterval(() => {
      selectArtwork((active.value + 1) % props.artworks.length);
    }, props.autoplayInterval);
  }
  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  watch(
    [() => props.autoplayInterval, () => props.artworks.length],
    () => startAutoplay(),
  );
  onMounted(startAutoplay);
  onBeforeUnmount(stopAutoplay);
</script>

<template>
  <div
    :class="
      cn(
        'w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:border-white/6',
        props.class,
      )
    "
  >
    <!-- featured painting -->
    <div class="relative aspect-4/3 overflow-hidden bg-muted">
      <AnimatePresence mode="sync">
        <component
          :is="motion.img"
          :key="featured.title"
          :src="featured.image"
          :alt="featured.title"
          :initial="{ opacity: 0, scale: 1.08 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 1.1, ease: 'easeInOut' }"
          class="absolute inset-0 size-full object-cover"
          @mouseenter="stopAutoplay"
          @mouseleave="startAutoplay"
        />
      </AnimatePresence>
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
      ></div>
    </div>

    <!-- title + caption -->
    <div class="p-5">
      <AnimatePresence mode="wait">
        <component
          :is="motion.div"
          :key="featured.title"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -10 }"
          :transition="{ duration: 0.5, ease: 'easeOut' }"
        >
          <p class="text-lg font-medium tracking-tight">{{ featured.title }}</p>
          <p class="mt-1 text-sm text-muted-foreground italic">
            {{ featured.caption }}
          </p>
        </component>
      </AnimatePresence>

      <!-- thumbnails -->
      <div class="mt-5 flex items-center gap-2">
        <button
          v-for="(art, i) in artworks"
          :key="art.title"
          type="button"
          :class="
            cn(
              'relative h-14 flex-1 overflow-hidden rounded-lg border transition-all duration-300',
              i === active
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent opacity-50 hover:opacity-90',
            )
          "
          @click="selectArtwork(i)"
        >
          <img
            :src="art.image"
            :alt="art.title"
            class="size-full object-cover"
          />
        </button>
      </div>
    </div>
  </div>
</template>
