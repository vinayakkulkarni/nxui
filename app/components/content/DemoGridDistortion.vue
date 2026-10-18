<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import GridDistortion from '@registry/new-york/grid-distortion/GridDistortion.vue';
  import type { GridDistortionProps } from '@registry/new-york/grid-distortion/types';
  import type { Pane } from 'tweakpane';

  const IMAGE =
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80&auto=format&fit=crop';

  const LOOK: GridDistortionProps = {
    grid: 15,
    radius: 0.18,
    strength: 0.15,
    relaxation: 0.96,
    mode: 'drag',
    softness: 0,
    chroma: 0,
  };

  const PRESETS: Record<string, GridDistortionProps> = {
    classic: {},
    liquid: { softness: 1, grid: 24, strength: 0.25, relaxation: 0.95 },
    glitch: {
      grid: 32,
      radius: 0.12,
      strength: 0.3,
      relaxation: 0.9,
      chroma: 0.6,
    },
    swirl: {
      mode: 'swirl',
      grid: 20,
      radius: 0.28,
      strength: 0.25,
      softness: 0.5,
    },
    tiles: { grid: 8, radius: 0.3, strength: 0.3, relaxation: 0.97 },
  };

  const params = reactive({
    preset: 'classic',
    grid: 15,
    radius: 0.18,
    strength: 0.15,
    relaxation: 0.96,
    mode: 'drag',
    softness: 0,
    chroma: 0,
    idle: 0.3,
    clickRipple: true,
    intro: true,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const mode = computed(() =>
    params.mode === 'push' || params.mode === 'swirl' ? params.mode : 'drag',
  );

  function applyPreset(value: string) {
    Object.assign(params, { ...LOOK, ...PRESETS[value] });
    paneRef?.refresh();
  }

  function replay() {
    replayKey.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Liquid: 'liquid',
          Glitch: 'glitch',
          Swirl: 'swirl',
          Tiles: 'tiles',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'grid', { min: 4, max: 60, step: 1 });
    pane.addBinding(params, 'radius', { min: 0.05, max: 0.5, step: 0.01 });
    pane.addBinding(params, 'strength', { min: 0, max: 0.6, step: 0.01 });
    pane.addBinding(params, 'relaxation', { min: 0.8, max: 0.99, step: 0.01 });
    pane.addBinding(params, 'mode', {
      options: { Drag: 'drag', Push: 'push', Swirl: 'swirl' },
    });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'chroma', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'idle', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'clickRipple');
    pane.addBinding(params, 'intro').on('change', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GridDistortion from '~/components/ui/grid-distortion/GridDistortion.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <GridDistortion
      image-src=&quot;https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&quot;
      :grid=&quot;15&quot;
      :radius=&quot;0.18&quot;
      :strength=&quot;0.15&quot;
      :relaxation=&quot;0.96&quot;
      mode=&quot;drag&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden bg-zinc-950">
      <GridDistortion
        :key="replayKey"
        class="absolute inset-0 size-full"
        :image-src="IMAGE"
        :grid="params.grid"
        :radius="params.radius"
        :strength="params.strength"
        :relaxation="params.relaxation"
        :mode="mode"
        :softness="params.softness"
        :chroma="params.chroma"
        :idle="params.idle"
        :click-ripple="params.clickRipple"
        :intro="params.intro"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-white select-none"
      >
        <span
          class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm"
        >
          New Background
        </span>
        <p
          class="max-w-xl text-3xl/tight font-semibold tracking-tight text-balance sm:text-5xl/tight"
        >
          Don't just sit there, move your cursor!
        </p>
      </div>

      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-white/60 select-none"
      >
        Move the cursor to break the grid · click to send a ripple
      </p>

      <ShaderPane title="Grid Distortion" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
