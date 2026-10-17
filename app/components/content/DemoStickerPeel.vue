<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import StickerPeel from '@registry/new-york/sticker-peel/StickerPeel.vue';
  import type { Pane } from 'tweakpane';
  import type {
    StickerPeelLook,
    StickerPeelPreset,
  } from '@registry/new-york/sticker-peel/types';

  const STICKERS: Record<string, string> = {
    nxui: '/stickers/nxui.png',
    github: '/stickers/github.webp',
    tailwind: '/stickers/tailwind.webp',
    openai: '/stickers/openai.webp',
    apple: '/stickers/apple.webp',
    vite: '/stickers/vite.webp',
  };

  const LOOK: StickerPeelLook = {
    finish: 'gloss',
    width: 200,
    rotate: 0,
    peelDirection: 0,
    peelBackHoverPct: 25,
    peelBackActivePct: 40,
    curlRadius: 12,
    backColor: '#d4d4d8',
    lightingIntensity: 0.5,
    shadowIntensity: 0.6,
    followPointer: true,
    swing: 1,
    friction: 0.5,
    bounce: 0.35,
  };

  const PRESETS: Record<string, StickerPeelPreset> = {
    signature: { sticker: 'nxui' },
    classic: { sticker: 'nxui', followPointer: false, peelBackHoverPct: 30 },
    holo: {
      sticker: 'apple',
      finish: 'holo',
      lightingIntensity: 0.8,
      width: 180,
    },
    matte: {
      sticker: 'github',
      finish: 'matte',
      backColor: '#f4f4f5',
      lightingIntensity: 0.3,
      shadowIntensity: 0.45,
    },
    vinyl: {
      sticker: 'tailwind',
      width: 240,
      curlRadius: 24,
      peelBackActivePct: 50,
      swing: 0.6,
      friction: 0.75,
      shadowIntensity: 0.75,
    },
    paper: {
      sticker: 'openai',
      finish: 'matte',
      curlRadius: 6,
      backColor: '#fafafa',
      swing: 1.6,
      friction: 0.35,
    },
    bouncy: {
      sticker: 'vite',
      rotate: -8,
      friction: 0.12,
      bounce: 0.85,
      swing: 1.4,
    },
  };

  const params = reactive({
    preset: 'signature',
    sticker: 'nxui',
    ...LOOK,
    draggable: true,
    intro: true,
  });

  let paneRef: Pane | null = null;

  watch(
    () => params.preset,
    (name) => {
      const preset = PRESETS[name];
      if (!preset) return;
      Object.assign(params, LOOK, preset);
      paneRef?.refresh();
    },
  );

  const imageSrc = () => STICKERS[params.sticker] ?? '/stickers/nxui.png';

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(params, 'preset', {
      options: {
        Signature: 'signature',
        Classic: 'classic',
        Holo: 'holo',
        Matte: 'matte',
        'Thick Vinyl': 'vinyl',
        Paper: 'paper',
        Bouncy: 'bouncy',
      },
    });
    pane.addBinding(params, 'sticker', {
      options: {
        nxui: 'nxui',
        GitHub: 'github',
        Tailwind: 'tailwind',
        OpenAI: 'openai',
        Apple: 'apple',
        Vite: 'vite',
      },
    });
    pane.addBinding(params, 'finish', {
      options: { Gloss: 'gloss', Matte: 'matte', Holo: 'holo' },
    });
    pane.addBinding(params, 'width', { min: 80, max: 360, step: 10 });
    pane.addBinding(params, 'rotate', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'peelDirection', { min: 0, max: 360, step: 5 });
    pane.addBinding(params, 'peelBackHoverPct', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'peelBackActivePct', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'curlRadius', { min: 2, max: 40, step: 1 });
    pane.addBinding(params, 'backColor');
    pane.addBinding(params, 'lightingIntensity', {
      min: 0,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'shadowIntensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'swing', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'friction', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'followPointer');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import StickerPeel from '~/components/ui/sticker-peel/StickerPeel.vue';
</script>

<template>
  <div class=&quot;relative h-130 w-full overflow-hidden&quot;>
    <StickerPeel
      image-src=&quot;/stickers/nxui.png&quot;
      finish=&quot;gloss&quot;
      :width=&quot;200&quot;
      :peel-back-hover-pct=&quot;25&quot;
      :peel-back-active-pct=&quot;40&quot;
      :curl-radius=&quot;12&quot;
      back-color=&quot;#d4d4d8&quot;
      :lighting-intensity=&quot;0.5&quot;
      :shadow-intensity=&quot;0.6&quot;
      follow-pointer
      draggable
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <StickerPeel
        :image-src="imageSrc()"
        :width="params.width"
        :rotate="params.rotate"
        :peel-direction="params.peelDirection"
        :peel-back-hover-pct="params.peelBackHoverPct"
        :peel-back-active-pct="params.peelBackActivePct"
        :curl-radius="params.curlRadius"
        :finish="params.finish"
        :back-color="params.backColor"
        :lighting-intensity="params.lightingIntensity"
        :shadow-intensity="params.shadowIntensity"
        :follow-pointer="params.followPointer"
        :draggable="params.draggable"
        :swing="params.swing"
        :friction="params.friction"
        :bounce="params.bounce"
        :intro="params.intro"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        hover to peel · drag and throw the sticker
      </p>
      <ShaderPane title="Sticker Peel" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
