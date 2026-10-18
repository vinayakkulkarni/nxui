<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import Orb from '@registry/new-york/orb/Orb.vue';
  import type { OrbProps } from '@registry/new-york/orb/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const LOOK = {
    size: 1,
    glow: 1,
    bleed: 1,
    wobble: 1,
    highlight: 1,
    trail: 1,
    tiltX: 0,
    tiltY: 0,
    speed: 1,
  };

  const CLASSIC = { color1: '#9c43fe', color2: '#4cc2e9', color3: '#101499' };

  const PRESETS: Record<
    string,
    Partial<typeof LOOK & typeof CLASSIC & { hue: number }>
  > = {
    classic: { ...CLASSIC },
    ember: {
      hue: 0,
      color1: '#ff6a3d',
      color2: '#ffc35c',
      color3: '#4a1206',
      glow: 1.2,
    },
    mint: {
      hue: 0,
      color1: '#2ee6b0',
      color2: '#8be9ff',
      color3: '#063b3a',
      wobble: 1.5,
      speed: 0.8,
    },
    mono: {
      hue: 0,
      color1: '#ffffff',
      color2: '#8d8d99',
      color3: '#17171c',
      highlight: 1.2,
    },
    halo: {
      ...CLASSIC,
      tiltX: 62,
      size: 1.35,
      glow: 1.4,
      trail: 2,
      wobble: 0.5,
      speed: 0.7,
    },
    comet: { ...CLASSIC, trail: 2.6, highlight: 1.6, speed: 1.4 },
  };

  // Mono's white ring vanishes on a white page, so it inverts there.
  const LIGHT_COLORS: Record<string, typeof CLASSIC> = {
    mono: { color1: '#18181b', color2: '#71717a', color3: '#d4d4d8' },
  };

  const params = reactive({
    preset: 'classic',
    ...CLASSIC,
    hue: 0,
    ...LOOK,
    hoverIntensity: 1,
    backgroundColor: '#000000',
    rotateOnHover: true,
    forceHoverState: false,
    followCursor: true,
    clickPulse: true,
    intro: true,
  });

  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const colors = computed<OrbProps['colors']>(() => [
    params.color1,
    params.color2,
    params.color3,
  ]);

  // A light background switches the orb to its soft, filled style.
  function themeDefaults() {
    return isLight.value
      ? { backgroundColor: '#ffffff', hue: 275 }
      : { backgroundColor: '#000000', hue: 0 };
  }

  function applyPreset(name: string) {
    Object.assign(
      params,
      LOOK,
      themeDefaults(),
      PRESETS[name] ?? {},
      isLight.value ? (LIGHT_COLORS[name] ?? {}) : {},
      { preset: name },
    );
    paneRef?.refresh();
  }

  function remount() {
    mountKey.value += 1;
  }

  watch(isLight, () => applyPreset(params.preset), { immediate: true });

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Ember: 'ember',
          Mint: 'mint',
          Mono: 'mono',
          Halo: 'halo',
          Comet: 'comet',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1', { label: 'primary' });
    pane.addBinding(params, 'color2', { label: 'secondary' });
    pane.addBinding(params, 'color3', { label: 'depth' });
    pane.addBinding(params, 'hue', { label: 'hue shift', min: 0, max: 360 });
    pane.addBinding(params, 'size', { min: 0.4, max: 1.6, step: 0.01 });
    pane.addBinding(params, 'glow', { min: 0.3, max: 3, step: 0.05 });
    pane.addBinding(params, 'bleed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'wobble', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'highlight', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'trail', { min: 0, max: 4, step: 0.05 });
    pane.addBinding(params, 'tiltX', { min: -70, max: 70, step: 1 });
    pane.addBinding(params, 'tiltY', { min: -70, max: 70, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'hoverIntensity', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'rotateOnHover');
    pane.addBinding(params, 'forceHoverState');
    pane.addBinding(params, 'followCursor');
    pane.addBinding(params, 'clickPulse');
    pane.addBinding(params, 'intro').on('change', remount);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Orb from '~/components/ui/orb/Orb.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden bg-black&quot;>
    <Orb
      :colors=&quot;['#9c43fe', '#4cc2e9', '#101499']&quot;
      :hover-intensity=&quot;1&quot;
      rotate-on-hover
      follow-cursor
      click-pulse
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden bg-background">
      <Orb
        :key="mountKey"
        class="absolute inset-0 size-full"
        :colors="colors"
        :hue="params.hue"
        :background-color="params.backgroundColor"
        :size="params.size"
        :glow="params.glow"
        :bleed="params.bleed"
        :wobble="params.wobble"
        :highlight="params.highlight"
        :trail="params.trail"
        :tilt-x="params.tiltX"
        :tilt-y="params.tiltY"
        :speed="params.speed"
        :hover-intensity="params.hoverIntensity"
        :rotate-on-hover="params.rotateOnHover"
        :force-hover-state="params.forceHoverState"
        :follow-cursor="params.followCursor"
        :click-pulse="params.clickPulse"
        :intro="params.intro"
      />

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center select-none"
      >
        <p
          class="max-w-xs text-2xl/tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl/tight"
        >
          Move closer and the orb reaches for you.
        </p>
        <p class="max-w-2xs text-sm/relaxed text-foreground/80">
          nxui brings motion and character to your interface, one copy-paste
          component at a time.
        </p>
      </div>

      <ShaderPane title="Orb" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
