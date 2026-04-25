<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { motion } from 'motion-v';
  import type { MusicPlayerProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<MusicPlayerProps>(), {
    autoPlay: false,
  });

  const isPlaying = ref(props.autoPlay);
  const audioRef = ref<HTMLAudioElement | null>(null);
  const iframeRef = ref<HTMLIFrameElement | null>(null);

  const getYoutubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
    );
    return match ? match[1] : null;
  };

  const youtubeId = computed(() =>
    props.src ? getYoutubeId(props.src) : null,
  );

  const togglePlay = () => {
    isPlaying.value = !isPlaying.value;
  };

  watch(isPlaying, async (playing) => {
    if (playing) {
      if (youtubeId.value && iframeRef.value?.contentWindow) {
        iframeRef.value.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*',
        );
      } else {
        try {
          await audioRef.value?.play();
        } catch {
          isPlaying.value = false;
        }
      }
    } else {
      if (youtubeId.value && iframeRef.value?.contentWindow) {
        iframeRef.value.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*',
        );
      } else {
        audioRef.value?.pause();
      }
    }
  });

  onMounted(() => {
    if (props.autoPlay) {
      isPlaying.value = true;
    }
  });
</script>

<template>
  <div :class="cn('relative inline-flex flex-col items-center', props.class)">
    <template v-if="youtubeId">
      <iframe
        ref="iframeRef"
        class="hidden"
        :src="`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${props.autoPlay ? 1 : 0}&controls=0`"
        allow="autoplay"
      />
    </template>
    <template v-else>
      <audio
        ref="audioRef"
        :src="props.src"
        @ended="isPlaying = false"
        class="hidden"
      />
    </template>

    <div
      class="relative cursor-pointer select-none size-64 md:size-80"
      role="button"
      :aria-label="isPlaying ? 'Pause' : 'Play'"
      :title="isPlaying ? 'Pause' : 'Play'"
      @click="togglePlay"
    >
      <!-- Tonearm -->
      <component
        :is="motion.div"
        class="absolute z-20 -top-[5%] -right-[10%] sm:-top-[8%] sm:-right-[15%] origin-top-right w-[60%] h-[15%] pointer-events-none"
        :initial="{ rotate: 10 }"
        :animate="{ rotate: isPlaying ? -20 : 10 }"
        :transition="{ duration: 0.5, ease: 'easeInOut' }"
      >
        <!-- Tonearm base -->
        <div
          class="absolute top-0 right-0 size-8 md:size-10 rounded-full bg-zinc-400 dark:bg-zinc-600 shadow-md transform translate-x-1/2 -translate-y-1/2 border-4 border-zinc-200 dark:border-zinc-800 z-10"
        />
        <!-- Tonearm stick & Needle -->
        <div
          class="absolute top-0 right-2.5 sm:right-4 w-[90%] h-2 md:h-3 bg-zinc-400 dark:bg-zinc-500 rounded-full origin-right -rotate-12 shadow-sm flex items-center justify-start"
        >
          <!-- Needle -->
          <div
            class="size-4 md:size-5 bg-zinc-800 dark:bg-zinc-300 rounded-full shadow-md transform -translate-x-1/2"
          />
        </div>
      </component>

      <!-- Record Disc -->
      <div
        :class="
          cn(
            'relative size-full rounded-full border-4 sm:border-8 border-black/10 dark:border-white/10 shadow-xl overflow-hidden shadow-black/30 bg-black animate-spin',
          )
        "
        :style="{
          animationDuration: '4s',
          animationPlayState: isPlaying ? 'running' : 'paused',
        }"
      >
        <!-- Album Cover Background -->
        <div
          class="absolute inset-0 bg-cover bg-center opacity-90 transition-opacity"
          :style="{ backgroundImage: `url(${props.coverArt})` }"
        />

        <!-- Grooves Overlay -->
        <div
          class="absolute inset-0 rounded-full border border-black/20"
          :style="{
            background:
              'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 21%, transparent 22%, transparent 35%, rgba(0,0,0,0.5) 36%, transparent 37%, transparent 50%, rgba(0,0,0,0.3) 51%, transparent 52%, transparent 65%, rgba(0,0,0,0.6) 66%, transparent 67%, transparent 80%, rgba(0,0,0,0.4) 81%, transparent 82%)',
          }"
        />

        <!-- Glare effect -->
        <div
          class="absolute inset-0 rounded-full pointer-events-none"
          :style="{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 100%)',
          }"
        />

        <!-- Center Hole and Label Area -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-zinc-900 border border-zinc-700 shadow-inner flex items-center justify-center"
        >
          <!-- The very center pin hole -->
          <div
            class="size-3 md:size-4 bg-zinc-300 dark:bg-zinc-600 rounded-full shadow-inner border border-black/40"
          />
        </div>
      </div>
    </div>
  </div>
</template>
