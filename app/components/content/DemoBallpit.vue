<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Ballpit from '@registry/new-york/ballpit/Ballpit.vue';
  import type {
    BallpitClickEffect,
    BallpitColor,
    BallpitProps,
  } from '@registry/new-york/ballpit/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const DEFAULT_CLICK: BallpitClickEffect = 'burst';

  const LOOK: Required<
    Omit<
      BallpitProps,
      'followCursor' | 'grab' | 'clickEffect' | 'intro' | 'dpr' | 'class'
    >
  > = {
    colors: ['#ffffff'],
    material: 'satin',
    count: 200,
    minSize: 0.5,
    maxSize: 1,
    gravity: 0,
    friction: 0.9975,
    wallBounce: 0.95,
    bounce: 0.85,
    depth: 2,
    drift: 0.4,
    cursorSize: 1,
    lightColor: '#ffffff',
    lightIntensity: 1,
    exposure: 1,
    shadows: 0.6,
  };

  const PRESETS: Record<string, BallpitProps> = {
    float: {},
    pit: { colors: ['#5227ff'], gravity: 0.6, drift: 0, count: 260 },
    clay: {
      material: 'matte',
      colors: ['#e8b4a0'],
      gravity: 0.6,
      drift: 0,
      shadows: 0.75,
    },
    gloss: { material: 'gloss', colors: ['#18181b', '#ff5b2e'] },
    frosted: {
      material: 'frosted',
      colors: ['#c7d2fe'],
      gravity: 0,
      drift: 0.5,
      count: 150,
    },
    metal: { material: 'metal', colors: ['#d4d4d8'], gravity: 0.6, drift: 0 },
    sprinkles: {
      colors: ['#ffffff', '#5227ff'],
      count: 900,
      minSize: 0.26,
      maxSize: 0.46,
      gravity: 0.6,
      drift: 0,
    },
    zero: {
      colors: ['#ff5b2e'],
      gravity: 0,
      drift: 0,
      friction: 1,
      bounce: 1,
      wallBounce: 1,
    },
  };

  // Presets whose colors vanish on a light page get a darker swap.
  const LIGHT_SWAP: Record<string, string[]> = {
    float: ['#18181b'],
    frosted: ['#a5b4fc'],
    sprinkles: ['#18181b', '#5227ff'],
  };

  const PALETTE_SLOTS = [
    '#ffffff',
    '#5227ff',
    '#ff5b2e',
    '#18181b',
    '#c7d2fe',
    '#e8b4a0',
  ];

  const params = reactive({
    preset: 'float',
    colorCount: 1,
    color1: '#ffffff',
    color2: PALETTE_SLOTS[1]!,
    color3: PALETTE_SLOTS[2]!,
    color4: PALETTE_SLOTS[3]!,
    color5: PALETTE_SLOTS[4]!,
    color6: PALETTE_SLOTS[5]!,
    material: LOOK.material,
    clickEffect: DEFAULT_CLICK,
    lightColor: LOOK.lightColor,
    count: LOOK.count,
    minSize: LOOK.minSize,
    maxSize: LOOK.maxSize,
    gravity: LOOK.gravity,
    friction: LOOK.friction,
    wallBounce: LOOK.wallBounce,
    bounce: LOOK.bounce,
    depth: LOOK.depth,
    drift: LOOK.drift,
    cursorSize: LOOK.cursorSize,
    lightIntensity: LOOK.lightIntensity,
    exposure: LOOK.exposure,
    shadows: LOOK.shadows,
    followCursor: true,
    grab: true,
    intro: true,
  });

  const colors = computed(() =>
    [
      params.color1,
      params.color2,
      params.color3,
      params.color4,
      params.color5,
      params.color6,
    ].slice(0, params.colorCount),
  );

  function toHex(color: BallpitColor | undefined, fallback: string) {
    if (color === undefined) return fallback;
    return typeof color === 'string'
      ? color
      : `#${color.toString(16).padStart(6, '0')}`;
  }

  function setColors(list: BallpitColor[]) {
    params.colorCount = list.length;
    params.color1 = toHex(list[0], PALETTE_SLOTS[0]!);
    params.color2 = toHex(list[1], PALETTE_SLOTS[1]!);
    params.color3 = toHex(list[2], PALETTE_SLOTS[2]!);
    params.color4 = toHex(list[3], PALETTE_SLOTS[3]!);
    params.color5 = toHex(list[4], PALETTE_SLOTS[4]!);
    params.color6 = toHex(list[5], PALETTE_SLOTS[5]!);
  }

  function applyPreset(value: string) {
    const preset = { ...LOOK, ...PRESETS[value] };
    const light = colorMode.value === 'light';
    setColors((light && LIGHT_SWAP[value]) || preset.colors);
    params.material = preset.material;
    params.count = preset.count;
    params.minSize = preset.minSize;
    params.maxSize = preset.maxSize;
    params.gravity = preset.gravity;
    params.friction = preset.friction;
    params.wallBounce = preset.wallBounce;
    params.bounce = preset.bounce;
    params.depth = preset.depth;
    params.drift = preset.drift;
    params.cursorSize = preset.cursorSize;
    params.lightColor = preset.lightColor;
    params.lightIntensity = preset.lightIntensity;
    params.exposure = preset.exposure;
    params.shadows = preset.shadows;
    params.preset = value;
    replayKey.value++;
    paneRef?.refresh();
  }

  watch(
    () => colorMode.value,
    () => applyPreset(params.preset),
    { immediate: true },
  );

  function replayIntro() {
    replayKey.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Float: 'float',
          Pit: 'pit',
          Clay: 'clay',
          Gloss: 'gloss',
          Frosted: 'frosted',
          Metal: 'metal',
          Sprinkles: 'sprinkles',
          'Zero G': 'zero',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'colorCount', {
      label: 'colors',
      min: 1,
      max: 6,
      step: 1,
    });
    pane.addBinding(params, 'color1');
    pane.addBinding(params, 'color2');
    pane.addBinding(params, 'color3');
    pane.addBinding(params, 'color4');
    pane.addBinding(params, 'color5');
    pane.addBinding(params, 'color6');
    pane.addBinding(params, 'material', {
      options: {
        Satin: 'satin',
        Matte: 'matte',
        Gloss: 'gloss',
        Frosted: 'frosted',
        Metal: 'metal',
      },
    });
    pane.addBinding(params, 'clickEffect', {
      options: { Burst: 'burst', None: 'none' },
    });
    pane.addBinding(params, 'lightColor');
    pane.addBinding(params, 'count', { min: 10, max: 1000, step: 10 });
    pane.addBinding(params, 'minSize', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'maxSize', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'gravity', { min: 0, max: 2, step: 0.01 });
    pane.addBinding(params, 'friction', { min: 0.95, max: 1, step: 0.0005 });
    pane.addBinding(params, 'wallBounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'bounce', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'depth', { min: 0, max: 6, step: 0.25 });
    pane.addBinding(params, 'drift', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'cursorSize', { min: 0.2, max: 3, step: 0.1 });
    pane.addBinding(params, 'lightIntensity', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'exposure', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'shadows', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'followCursor');
    pane.addBinding(params, 'grab');
    pane.addBinding(params, 'intro').on('change', replayIntro);
  }

  function stopPointer(event: PointerEvent) {
    event.stopPropagation();
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Ballpit from '~/components/ui/ballpit/Ballpit.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <Ballpit
      :count=&quot;200&quot;
      :colors=&quot;['#ffffff']&quot;
      material=&quot;satin&quot;
      :gravity=&quot;0&quot;
      :drift=&quot;0.4&quot;
      :follow-cursor=&quot;true&quot;
      :grab=&quot;true&quot;
      click-effect=&quot;burst&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-100 overflow-hidden bg-background">
      <Ballpit
        :key="replayKey"
        class="absolute inset-0 size-full"
        :count="params.count"
        :colors="colors"
        :material="params.material"
        :min-size="params.minSize"
        :max-size="params.maxSize"
        :gravity="params.gravity"
        :friction="params.friction"
        :wall-bounce="params.wallBounce"
        :bounce="params.bounce"
        :depth="params.depth"
        :drift="params.drift"
        :follow-cursor="params.followCursor"
        :cursor-size="params.cursorSize"
        :grab="params.grab"
        :click-effect="params.clickEffect"
        :light-color="params.lightColor"
        :light-intensity="params.lightIntensity"
        :exposure="params.exposure"
        :shadows="params.shadows"
        :intro="params.intro"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-6 z-10 px-6 text-center"
      >
        <span
          class="inline-block rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur-sm"
        >
          Move to shove, press a ball to grab and throw it, click empty space to
          blast.
        </span>
      </p>
      <div class="contents" @pointerdown="stopPointer">
        <ShaderPane title="Ballpit" @on-pane-created="onPaneCreated" />
      </div>
    </div>
  </ComponentDemo>
</template>
