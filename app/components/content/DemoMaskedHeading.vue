<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import MaskedHeading from '@registry/new-york/masked-heading/MaskedHeading.vue';
  import type {
    MaskedHeadingAlign,
    MaskedHeadingMediaType,
    MaskedHeadingReveal,
    MaskedHeadingTrigger,
  } from '@registry/new-york/masked-heading/types';
  import type { Pane } from 'tweakpane';

  const DEMO_IMAGE =
    'https://images.unsplash.com/photo-1500673587002-1d2548cfba1b?q=80&w=1600&auto=format&fit=crop';
  const DEMO_VIDEO = 'https://reactbits.dev/assets/video/masked-heading.mp4';

  const VIDEO: MaskedHeadingMediaType = 'video';
  const IMAGE: MaskedHeadingMediaType = 'image';
  const SCALE: MaskedHeadingReveal = 'scale';
  const RISE: MaskedHeadingReveal = 'rise';
  const WIPE: MaskedHeadingReveal = 'wipe';
  const BLUR: MaskedHeadingReveal = 'blur';
  const CENTER: MaskedHeadingAlign = 'center';
  const LEFT: MaskedHeadingAlign = 'left';
  const VIEW: MaskedHeadingTrigger = 'view';

  // Mirrors the upstream demo's LOOK + PRESETS. `autoOutlineColor` stands
  // in for upstream's empty-string "follow the text color".
  const LOOK = {
    tinted: false,
    tintColor: '#ff5a36',
    autoOutlineColor: true,
    outlineColor: '#ffffff',
    text: 'Designed in the details',
    mediaType: VIDEO,
    reveal: SCALE,
    duration: 1.1,
    stagger: 0.09,
    parallax: 26,
    drift: 18,
    hoverZoom: 0,
    spotlight: false,
    spotlightRadius: 180,
    align: CENTER,
    fillScale: 1.25,
    brightness: 1,
    saturation: 1,
    grayscale: false,
    outline: false,
    outlineWidth: 1,
    weight: 700,
    tracking: -0.03,
    lineHeight: 1.06,
    textScale: 0.115,
  };

  const PRESETS = {
    cinema: { ...LOOK },
    spotlight: {
      ...LOOK,
      text: 'Shot on location',
      mediaType: IMAGE,
      reveal: RISE,
      drift: 10,
      hoverZoom: 0.06,
      spotlight: true,
      spotlightRadius: 200,
      saturation: 1.15,
      weight: 800,
      tracking: -0.04,
    },
    stencil: {
      ...LOOK,
      text: 'Made for the web',
      mediaType: IMAGE,
      reveal: WIPE,
      duration: 1.6,
      parallax: 60,
      align: LEFT,
      fillScale: 1.5,
      brightness: 1.1,
      grayscale: true,
      outline: true,
      outlineWidth: 1.5,
      weight: 900,
      tracking: -0.05,
      lineHeight: 0.92,
      textScale: 0.14,
    },
    duotone: {
      ...LOOK,
      tinted: true,
      reveal: BLUR,
      duration: 1.4,
      drift: 30,
      brightness: 1.1,
      tracking: -0.02,
    },
  };

  function isPreset(value: unknown): value is keyof typeof PRESETS {
    return typeof value === 'string' && value in PRESETS;
  }

  const params = reactive({
    preset: 'cinema',
    trigger: VIEW,
    ...LOOK,
  });

  // Like upstream's replayKey: remount so the entrance plays again.
  const replayKey = computed(() =>
    [
      params.preset,
      params.text,
      params.mediaType,
      params.reveal,
      params.trigger,
      params.duration,
      params.stagger,
    ].join('-'),
  );

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', {
        options: {
          Cinema: 'cinema',
          Spotlight: 'spotlight',
          Stencil: 'stencil',
          Duotone: 'duotone',
        },
      })
      .on('change', (ev) => {
        if (!isPreset(ev.value)) return;
        Object.assign(params, PRESETS[ev.value]);
        pane.refresh();
      });
    pane.addBinding(params, 'tinted');
    pane.addBinding(params, 'tintColor');
    pane.addBinding(params, 'autoOutlineColor');
    pane.addBinding(params, 'outlineColor');
    pane.addBinding(params, 'reveal', {
      options: {
        Rise: 'rise',
        Scale: 'scale',
        Blur: 'blur',
        Wipe: 'wipe',
        Fade: 'fade',
        None: 'none',
      },
    });
    pane.addBinding(params, 'trigger', {
      options: { 'In View': 'view', 'On Mount': 'mount', 'On Hover': 'hover' },
    });
    pane.addBinding(params, 'duration', { min: 0.3, max: 2.4, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'parallax', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'drift', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'hoverZoom', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'spotlight');
    pane.addBinding(params, 'spotlightRadius', { min: 60, max: 400, step: 10 });
    pane.addBinding(params, 'text', {
      options: {
        Details: 'Designed in the details',
        Web: 'Made for the web',
        Location: 'Shot on location',
      },
    });
    pane.addBinding(params, 'mediaType', {
      options: { Video: 'video', Image: 'image' },
    });
    pane.addBinding(params, 'align', {
      options: { Center: 'center', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'fillScale', { min: 1, max: 2, step: 0.05 });
    pane.addBinding(params, 'brightness', { min: 0.4, max: 2, step: 0.05 });
    pane.addBinding(params, 'saturation', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'grayscale');
    pane.addBinding(params, 'textScale', {
      min: 0.05,
      max: 0.15,
      step: 0.005,
    });
    pane.addBinding(params, 'weight', { min: 300, max: 900, step: 100 });
    pane.addBinding(params, 'tracking', {
      min: -0.08,
      max: 0.06,
      step: 0.005,
    });
    pane.addBinding(params, 'lineHeight', { min: 0.85, max: 1.6, step: 0.02 });
    pane.addBinding(params, 'outline');
    pane.addBinding(params, 'outlineWidth', { min: 0.5, max: 4, step: 0.25 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MaskedHeading from '~/components/ui/masked-heading/MaskedHeading.vue';
</script>

<template>
  <MaskedHeading
    text=&quot;Designed in the details&quot;
    media-type=&quot;video&quot;
    src=&quot;/video/clip.mp4&quot;
    reveal=&quot;scale&quot;
    :duration=&quot;1.1&quot;
    :stagger=&quot;0.09&quot;
    :parallax=&quot;26&quot;
    :drift=&quot;18&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden px-5 text-foreground sm:pr-70 md:pl-10"
    >
      <MaskedHeading
        :key="replayKey"
        :text="params.text"
        :media-type="params.mediaType"
        :src="params.mediaType === 'video' ? DEMO_VIDEO : DEMO_IMAGE"
        :reveal="params.reveal"
        :trigger="params.trigger"
        :duration="params.duration"
        :stagger="params.stagger"
        :parallax="params.parallax"
        :drift="params.drift"
        :hover-zoom="params.hoverZoom"
        :spotlight="params.spotlight"
        :spotlight-radius="params.spotlightRadius"
        :align="params.align"
        :fill-scale="params.fillScale"
        :brightness="params.brightness"
        :saturation="params.saturation"
        :grayscale="params.grayscale"
        :tint="params.tinted ? params.tintColor : ''"
        :outline="params.outline"
        :outline-color="params.autoOutlineColor ? '' : params.outlineColor"
        :outline-width="params.outlineWidth"
        :weight="params.weight"
        :tracking="params.tracking"
        :line-height="params.lineHeight"
        :text-scale="params.textScale"
      />
      <ShaderPane title="Masked Heading" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
