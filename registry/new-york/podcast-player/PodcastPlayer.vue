<script setup lang="ts">
  // Podcast player: an expandable episode card driving a real
  // HTMLAudioElement — waveform seek bar with hover scrubber, chapter chips,
  // playback-speed cycling, volume slider, follow/save toasts, and a compact
  // pill mode. Inspired by the "Podcast player (dark mode)" exploration by
  // @disarto_max, extended with light-mode + responsive support.
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import PodcastPlayerWaveform from './PodcastPlayerWaveform.vue';
  import type { PodcastPlayerProps } from './types';

  const props = withDefaults(defineProps<PodcastPlayerProps>(), {
    date: '',
    rating: '',
    ratingCount: '',
    meta: () => [],
    description: '',
    chapters: () => [],
    accent: '#f4502c',
    bars: 96,
    class: '',
  });

  const emit = defineEmits<{
    play: [];
    pause: [];
    ended: [];
  }>();

  const SPEEDS = [1, 1.25, 1.5, 2];

  const audio = ref<HTMLAudioElement | null>(null);
  const playing = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const speedIndex = ref(0);
  const volume = ref(0.8);
  const expanded = ref(true);
  const following = ref(false);
  const saved = ref(false);
  const toast = ref<string | null>(null);

  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Deterministic pseudo-random waveform so SSR and client render the same
  // bars without needing to decode the audio file.
  const heights = computed(() => {
    const out: number[] = [];
    let seed = 42;
    for (let i = 0; i < props.bars; i++) {
      seed = (seed * 16807) % 2147483647;
      const noise = (seed % 1000) / 1000;
      const envelope = 0.55 + 0.45 * Math.sin(i * 0.35 + noise * 2);
      out.push(Math.max(0.12, Math.min(1, noise * envelope + 0.15)));
    }
    return out;
  });

  const progress = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0,
  );

  function fmt(total: number): string {
    const t = Math.max(0, Math.floor(total));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const minutesLeft = computed(() => {
    const left = Math.max(0, duration.value - currentTime.value);
    return `${Math.ceil(left / 60)} min left`;
  });

  const speedLabel = computed(() => `${SPEEDS[speedIndex.value]}x`);

  function toggle() {
    const el = audio.value;
    if (!el) return;
    if (playing.value) el.pause();
    else void el.play();
  }

  function seek(fraction: number) {
    const el = audio.value;
    if (!el || duration.value === 0) return;
    el.currentTime = fraction * duration.value;
    currentTime.value = el.currentTime;
  }

  function seekTo(seconds: number) {
    const el = audio.value;
    if (!el) return;
    el.currentTime = Math.min(seconds, duration.value || seconds);
    currentTime.value = el.currentTime;
    if (!playing.value) void el.play();
  }

  function cycleSpeed() {
    speedIndex.value = (speedIndex.value + 1) % SPEEDS.length;
    if (audio.value) audio.value.playbackRate = SPEEDS[speedIndex.value]!;
  }

  function setVolume(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    volume.value = value;
    if (audio.value) audio.value.volume = value;
  }

  function showToast(message: string) {
    toast.value = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.value = null), 2200);
  }

  function toggleFollow() {
    following.value = !following.value;
    showToast(following.value ? 'Following' : 'Unfollowed');
  }

  function toggleSave() {
    saved.value = !saved.value;
    showToast(saved.value ? 'Saved to your library' : 'Removed from library');
  }

  const activeChapter = computed(() => {
    let index = -1;
    props.chapters.forEach((chapter, i) => {
      if (currentTime.value >= chapter.time) index = i;
    });
    return index;
  });

  onMounted(() => {
    const el = new Audio(props.src);
    el.preload = 'metadata';
    el.volume = volume.value;
    el.addEventListener('loadedmetadata', () => {
      duration.value = el.duration;
    });
    el.addEventListener('timeupdate', () => {
      currentTime.value = el.currentTime;
    });
    el.addEventListener('play', () => {
      playing.value = true;
      emit('play');
    });
    el.addEventListener('pause', () => {
      playing.value = false;
      emit('pause');
    });
    el.addEventListener('ended', () => {
      playing.value = false;
      emit('ended');
    });
    audio.value = el;
  });

  onBeforeUnmount(() => {
    audio.value?.pause();
    audio.value = null;
    if (toastTimer) clearTimeout(toastTimer);
  });

  watch(
    () => props.src,
    (src) => {
      if (audio.value) {
        audio.value.src = src;
        currentTime.value = 0;
      }
    },
  );
</script>

<template>
  <div :class="cn('relative w-full max-w-2xl font-sans', props.class)">
    <AnimatePresence mode="wait">
      <!-- Expanded card -->
      <component
        :is="motion.div"
        v-if="expanded"
        key="card"
        class="w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
        :initial="{ opacity: 0, scale: 0.96, y: 8 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.96, y: 8 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
      >
        <!-- Title bar -->
        <div
          class="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6"
        >
          <span class="text-sm font-medium">Podcast</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Collapse player"
              @click="expanded = false"
            >
              <Icon name="lucide:minimize-2" class="size-3.5" />
            </button>
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
              @click="expanded = false"
            >
              <Icon name="lucide:x" class="size-4" />
            </button>
          </div>
        </div>

        <!-- Episode header -->
        <div class="px-4 pt-4 sm:px-6 sm:pt-5">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <div
                class="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase"
              >
                {{ show }}
              </div>
              <h3 class="mt-1 truncate text-xl font-semibold sm:text-2xl">
                {{ title }}
              </h3>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
              <span
                v-if="date"
                class="font-mono text-[10px] tracking-[0.15em] text-muted-foreground"
              >
                {{ date }}
              </span>
              <button
                type="button"
                class="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors"
                :class="
                  following
                    ? 'border-transparent text-white'
                    : 'border-border text-foreground hover:bg-muted'
                "
                :style="following ? { background: accent } : undefined"
                @click="toggleFollow"
              >
                <Icon
                  :name="following ? 'lucide:user-check' : 'lucide:user-plus'"
                  class="size-3"
                />
                {{ following ? 'Following' : 'Follow' }}
              </button>
            </div>
          </div>

          <div
            v-if="rating || meta.length"
            class="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase"
          >
            <template v-if="rating">
              <Icon
                name="lucide:star"
                class="size-3"
                :style="{ color: accent }"
              />
              <span class="font-semibold text-foreground">{{ rating }}</span>
              <span v-if="ratingCount">({{ ratingCount }})</span>
            </template>
            <template v-for="(item, i) in meta" :key="item">
              <span v-if="rating || i > 0">/</span>
              <span>{{ item }}</span>
            </template>
          </div>

          <p
            v-if="description"
            class="mt-3 text-sm/relaxed text-muted-foreground"
          >
            {{ description }}
          </p>

          <!-- Chapters -->
          <div v-if="chapters.length" class="mt-3 flex flex-wrap gap-1.5">
            <button
              v-for="(chapter, i) in chapters"
              :key="chapter.label"
              type="button"
              class="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors"
              :class="
                i === activeChapter
                  ? 'border-current'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              "
              :style="i === activeChapter ? { color: accent } : undefined"
              @click="seekTo(chapter.time)"
            >
              <span class="tabular-nums">{{ fmt(chapter.time) }}</span>
              <span
                :class="i === activeChapter ? 'text-foreground' : undefined"
              >
                {{ chapter.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Transport -->
        <div class="flex items-center gap-3 px-4 pt-4 sm:gap-4 sm:px-6">
          <button
            type="button"
            class="flex h-12 w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border transition-colors hover:bg-muted sm:h-14 sm:w-16"
            :aria-label="playing ? 'Pause' : 'Play'"
            @click="toggle"
          >
            <Icon
              :name="playing ? 'lucide:pause' : 'lucide:play'"
              class="size-5"
              :style="{ color: accent }"
            />
          </button>
          <PodcastPlayerWaveform
            :heights="heights"
            :progress="progress"
            :duration="duration"
            :accent="accent"
            @seek="seek"
          />
        </div>

        <!-- Time row -->
        <div
          class="mt-3 flex items-center justify-between border-b border-border px-4 pb-3 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase sm:px-6"
        >
          <span class="tabular-nums">
            {{ fmt(currentTime) }} / {{ fmt(duration) }}
          </span>
          <span>{{ minutesLeft }}</span>
        </div>

        <!-- Toolbar -->
        <div
          class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6"
        >
          <div class="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="More options"
            >
              <Icon name="lucide:ellipsis-vertical" class="size-4" />
            </button>
            <button
              type="button"
              class="flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted"
              :class="
                saved ? '' : 'text-muted-foreground hover:text-foreground'
              "
              :style="saved ? { color: accent } : undefined"
              :aria-label="saved ? 'Remove from library' : 'Save to library'"
              @click="toggleSave"
            >
              <Icon
                :name="saved ? 'lucide:bookmark-check' : 'lucide:bookmark'"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Share"
            >
              <Icon name="lucide:forward" class="size-4" />
            </button>
            <button
              type="button"
              class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Copy link"
            >
              <Icon name="lucide:link" class="size-4" />
            </button>
            <button
              type="button"
              class="hidden size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              aria-label="Embed"
            >
              <Icon name="lucide:code-xml" class="size-4" />
            </button>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              class="cursor-pointer rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground uppercase transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Playback speed"
              @click="cycleSpeed"
            >
              {{ speedLabel }}
            </button>
            <span class="h-4 w-px bg-border" />
            <Icon
              :name="volume === 0 ? 'lucide:volume-x' : 'lucide:volume-2'"
              class="size-4 text-muted-foreground"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="volume"
              class="podcast-volume h-1 w-14 cursor-pointer appearance-none rounded-full bg-border sm:w-18"
              :style="{
                backgroundImage: `linear-gradient(${accent}, ${accent})`,
                backgroundSize: `${volume * 100}% 100%`,
                backgroundRepeat: 'no-repeat',
                '--pp-accent': accent,
              }"
              aria-label="Volume"
              @input="setVolume"
            />
          </div>
        </div>
      </component>

      <!-- Compact pill -->
      <component
        :is="motion.div"
        v-else
        key="pill"
        class="mx-auto flex w-fit max-w-full items-center gap-3 rounded-full border border-border bg-card p-2 text-card-foreground shadow-xl"
        :initial="{ opacity: 0, scale: 0.9, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.9, y: -6 }"
        :transition="{ duration: 0.25, ease: 'easeOut' }"
      >
        <button
          type="button"
          class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full"
          :style="{
            background: `color-mix(in srgb, ${accent} 18%, transparent)`,
          }"
          :aria-label="playing ? 'Pause' : 'Play'"
          @click="toggle"
        >
          <Icon
            :name="playing ? 'lucide:pause' : 'lucide:play'"
            class="size-4"
            :style="{ color: accent }"
          />
        </button>
        <div class="min-w-0">
          <div class="truncate text-sm font-medium">{{ title }}</div>
          <div
            class="truncate font-mono text-[9px] tracking-[0.18em] text-muted-foreground uppercase"
          >
            {{ show }}
          </div>
        </div>
        <div class="hidden h-5 w-24 shrink-0 items-center gap-px sm:flex">
          <span
            v-for="(h, i) in heights.slice(0, 32)"
            :key="i"
            class="min-w-0.5 flex-1 rounded-full"
            :style="{
              height: `${h * 100}%`,
              background: i / 32 <= progress ? accent : 'var(--border)',
            }"
          />
        </div>
        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase transition-colors"
          :style="{
            color: accent,
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }"
          @click="expanded = true"
        >
          Open
        </button>
      </component>
    </AnimatePresence>

    <!-- Toast -->
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="toast"
        key="toast"
        class="absolute -bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-popover px-3 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: 8 }"
        :transition="{ duration: 0.2 }"
      >
        <span class="size-1.5 rounded-full" :style="{ background: accent }" />
        {{ toast }}
      </component>
    </AnimatePresence>
  </div>
</template>

<style scoped>
  .podcast-volume::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    background: var(--pp-accent, #f4502c);
  }
  .podcast-volume::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 9999px;
    background: var(--pp-accent, #f4502c);
  }
</style>
