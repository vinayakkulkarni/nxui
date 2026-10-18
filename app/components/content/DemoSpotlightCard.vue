<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SpotlightCard from '@registry/new-york/spotlight-card/SpotlightCard.vue';
  import type {
    SpotlightCardShape,
    SpotlightCardTheme,
  } from '@registry/new-york/spotlight-card/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_COLOR = '#ffffff';
  const DEFAULT_SHAPE: SpotlightCardShape = 'circle';

  const AVATAR =
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=240&h=240&fit=crop&crop=focalpoint&fp-x=0.64&fp-y=0.355&fp-z=1.45&sat=-100&q=80';

  const SKILLS = ['Figma', 'UX Design'];

  const STATS = [
    { value: '4.5', label: 'Rating', star: true },
    { value: '$15K+', label: 'Earned', star: false },
    { value: '$80/hr', label: 'Rate', star: false },
  ];

  const params = reactive({
    spotlightColor: DEFAULT_COLOR,
    shape: DEFAULT_SHAPE,
    intensity: 0.15,
    spotlightSize: 240,
    softness: 0.7,
    borderGlow: 0.6,
    proximity: 80,
    smoothing: 0.3,
    grain: 0,
    ambient: false,
    flare: true,
  });

  const colorMode = useColorMode();
  const theme = computed<SpotlightCardTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const color = computed(() =>
    theme.value === 'light' && params.spotlightColor === DEFAULT_COLOR
      ? undefined
      : params.spotlightColor,
  );

  const cardClass = computed(
    () =>
      `w-full max-w-82 rounded-[28px] p-6 select-none ${theme.value === 'dark' ? 'text-white' : 'text-zinc-900'}`,
  );

  const saved = ref(false);

  function toggleSaved() {
    saved.value = !saved.value;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'spotlightColor', { label: 'color' });
    pane.addBinding(params, 'shape', {
      options: { Circle: 'circle', Beam: 'beam' },
    });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'spotlightSize', {
      label: 'size',
      min: 80,
      max: 600,
      step: 10,
    });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'borderGlow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'proximity', { min: 0, max: 240, step: 10 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grain', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'ambient');
    pane.addBinding(params, 'flare');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SpotlightCard from '~/components/ui/spotlight-card/SpotlightCard.vue';
</script>

<template>
  <SpotlightCard
    class=&quot;w-full max-w-82 rounded-[28px] p-6 text-white&quot;
    spotlight-color=&quot;#ffffff&quot;
    shape=&quot;circle&quot;
    :intensity=&quot;0.15&quot;
    :spotlight-size=&quot;240&quot;
    :softness=&quot;0.7&quot;
    :border-glow=&quot;0.6&quot;
    :proximity=&quot;80&quot;
    :smoothing=&quot;0.3&quot;
    theme=&quot;dark&quot;
  >
    <h3 class=&quot;text-2xl font-medium&quot;>Ethan Harrison</h3>
    <p class=&quot;text-sm text-white/60&quot;>Product designer</p>
  </SpotlightCard>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <SpotlightCard
        :class="cardClass"
        :spotlight-color="color"
        :shape="params.shape"
        :intensity="params.intensity"
        :spotlight-size="params.spotlightSize"
        :softness="params.softness"
        :border-glow="params.borderGlow"
        :proximity="params.proximity"
        :smoothing="params.smoothing"
        :grain="params.grain"
        :ambient="params.ambient"
        :flare="params.flare"
        :theme="theme"
      >
        <div class="flex items-start justify-between">
          <div
            class="size-15 rounded-full bg-[#9a9a9a] bg-cover bg-center"
            :style="{ backgroundImage: `url(${AVATAR})` }"
            role="img"
            aria-label="Ethan Harrison"
          />
          <button
            type="button"
            aria-label="Share profile"
            :class="[
              '-mt-1 -mr-1.5 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none',
              theme === 'dark' ? 'hover:bg-white/8' : 'hover:bg-zinc-900/5',
            ]"
          >
            <Icon name="lucide:share" class="size-5" />
          </button>
        </div>

        <p class="mt-4 text-[1.45rem]/tight font-medium tracking-tight">
          Ethan Harrison
        </p>
        <p
          :class="[
            'mt-1 text-[15px]',
            theme === 'dark' ? 'text-white/55' : 'text-zinc-500',
          ]"
        >
          Product designer
        </p>

        <div class="mt-3.5 flex gap-2">
          <span
            v-for="skill in SKILLS"
            :key="skill"
            :class="[
              'rounded-lg px-2.5 py-1.25 text-xs/none font-medium',
              theme === 'dark' ? 'bg-white/8' : 'bg-zinc-900/5',
            ]"
          >
            {{ skill }}
          </span>
        </div>

        <div class="mt-6 flex items-stretch">
          <div
            v-for="stat in STATS"
            :key="stat.label"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div class="flex items-center gap-1.5 text-[15px] font-medium">
              <Icon
                v-if="stat.star"
                name="lucide:star"
                mode="svg"
                class="size-3.75 **:fill-current"
              />
              {{ stat.value }}
            </div>
            <span
              :class="[
                'text-xs',
                theme === 'dark' ? 'text-white/55' : 'text-zinc-500',
              ]"
            >
              {{ stat.label }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex gap-2.5">
          <button
            type="button"
            :class="[
              'h-12 flex-1 cursor-pointer rounded-full text-[15px] font-medium backdrop-blur-md backdrop-saturate-150 transition-colors focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none',
              theme === 'dark'
                ? 'bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_-12px_rgba(0,0,0,0.7)] hover:bg-white/13'
                : 'bg-zinc-900/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-14px_rgba(24,24,27,0.3)] hover:bg-zinc-900/8',
            ]"
          >
            Get in touch
          </button>
          <button
            type="button"
            :aria-label="saved ? 'Remove bookmark' : 'Bookmark profile'"
            :aria-pressed="saved"
            :class="[
              'flex size-12 cursor-pointer items-center justify-center rounded-full backdrop-blur-md backdrop-saturate-150 transition-colors focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:outline-none',
              saved
                ? theme === 'dark'
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-900 text-white'
                : theme === 'dark'
                  ? 'bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_-12px_rgba(0,0,0,0.7)] hover:bg-white/13'
                  : 'bg-zinc-900/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-14px_rgba(24,24,27,0.3)] hover:bg-zinc-900/8',
            ]"
            @click="toggleSaved"
          >
            <Icon
              name="lucide:bookmark"
              mode="svg"
              :class="['size-5', saved ? '**:fill-current' : '']"
            />
          </button>
        </div>
      </SpotlightCard>
      <ShaderPane title="Spotlight Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
