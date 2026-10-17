<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import Noise from '@registry/new-york/noise/Noise.vue';
  import type {
    NoiseBlendMode,
    NoiseProps,
  } from '@registry/new-york/noise/types';
  import type { Pane } from 'tweakpane';

  const PHOTO =
    'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=1600&q=80&auto=format&fit=crop';

  const SCENES: Record<string, string> = {
    photo: `center / cover no-repeat url("${PHOTO}")`,
    studio:
      'radial-gradient(70% 90% at 50% 34%, #a29b92 0%, #7a746d 30%, #4b4743 62%, #262422 88%, #1c1b1a 100%)',
    dark: '#0b0b0d',
    paper: '#f3efe6',
  };

  const DEFAULTS = {
    scene: 'photo',
    opacity: 0.2,
    size: 1,
    fps: 24,
    blendMode: 'overlay' as NoiseBlendMode,
    contrast: 0.6,
    colored: false,
    dust: 0,
    scratches: 0,
    scanlines: 0,
    flicker: 0,
  };

  const PRESETS: Record<string, NoiseProps & { scene?: string }> = {
    film: {},
    studio: {
      scene: 'studio',
      opacity: 0.15,
      fps: 18,
      blendMode: 'overlay',
      contrast: 0.5,
    },
    dust: { opacity: 0.16, fps: 18, dust: 0.55, scratches: 0.5, flicker: 0.25 },
    static: {
      scene: 'dark',
      opacity: 0.42,
      size: 2,
      fps: 30,
      blendMode: 'screen',
      contrast: 1,
      scanlines: 0.4,
      flicker: 0.35,
    },
    paper: {
      scene: 'paper',
      opacity: 0.5,
      fps: 0,
      blendMode: 'soft-light',
      contrast: 0.3,
    },
  };

  const params = reactive({ preset: 'film', ...DEFAULTS });

  const background = computed(() => SCENES[params.scene] ?? SCENES.photo);

  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, DEFAULTS, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Film: 'film',
          Studio: 'studio',
          Dust: 'dust',
          Static: 'static',
          Paper: 'paper',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'scene', {
      options: {
        Photo: 'photo',
        Studio: 'studio',
        Dark: 'dark',
        Paper: 'paper',
      },
    });
    pane.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'size', { min: 0.5, max: 4, step: 0.5 });
    pane.addBinding(params, 'fps', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'blendMode', {
      label: 'blend',
      options: {
        Normal: 'normal',
        Overlay: 'overlay',
        'Soft Light': 'soft-light',
        Multiply: 'multiply',
        Screen: 'screen',
        Difference: 'difference',
      },
    });
    pane.addBinding(params, 'contrast', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'dust', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'scratches', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'scanlines', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'colored');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Noise from '~/components/ui/noise/Noise.vue';
</script>

<template>
  <div class=&quot;relative h-125 overflow-hidden&quot;>
    <img src=&quot;/photo.jpg&quot; alt=&quot;&quot; class=&quot;size-full object-cover&quot; />
    <Noise
      :opacity=&quot;0.2&quot;
      :fps=&quot;24&quot;
      blend-mode=&quot;overlay&quot;
      :contrast=&quot;0.6&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden"
      :style="{ background }"
    >
      <Noise
        class="absolute inset-0 size-full"
        :opacity="params.opacity"
        :size="params.size"
        :fps="params.fps"
        :blend-mode="params.blendMode"
        :contrast="params.contrast"
        :colored="params.colored"
        :dust="params.dust"
        :scratches="params.scratches"
        :scanlines="params.scanlines"
        :flicker="params.flicker"
      />
      <ShaderPane expanded title="Noise" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
