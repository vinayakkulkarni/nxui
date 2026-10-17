<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import SpecularButton from '@registry/new-york/specular-button/SpecularButton.vue';
  import type { SpecularButtonProps } from '@registry/new-york/specular-button/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_TINT = '#ffffff';
  const DEFAULT_TINT_OPACITY = 0.04;
  const DEFAULT_TEXT = '#f5f5f5';
  const DEFAULT_BASE = '#525252';

  const GLASS = {
    radius: 18,
    thickness: 1.2,
    glow: 1,
    shineSize: 10,
    shineFade: 34,
    idleIntensity: 0.35,
    autoAnimate: false,
    speed: 0.35,
  };

  const PRESETS = {
    glass: GLASS,
    pill: {
      ...GLASS,
      radius: 40,
      thickness: 1.5,
      glow: 1.4,
      shineSize: 14,
      shineFade: 40,
    },
    crisp: {
      ...GLASS,
      radius: 12,
      thickness: 1,
      glow: 0,
      shineSize: 6,
      shineFade: 22,
      idleIntensity: 0.5,
    },
    orbit: { ...GLASS, autoAnimate: true, speed: 0.8 },
  };

  const params = reactive<
    Required<Omit<SpecularButtonProps, 'type' | 'class'>> & {
      preset: keyof typeof PRESETS;
    }
  >({
    preset: 'glass',
    size: 'lg',
    ...GLASS,
    tint: DEFAULT_TINT,
    tintOpacity: DEFAULT_TINT_OPACITY,
    blur: 0,
    textColor: DEFAULT_TEXT,
    lineColor: '#ffffff',
    baseColor: DEFAULT_BASE,
    intensity: 1,
    followMouse: true,
    proximity: 250,
    disabled: false,
  });

  const PAGE = { dark: '#120f17', light: '#ffffff' };

  function luminance(hex: string): number {
    const value = Number.parseInt(
      hex.replace('#', '').padEnd(6, '0').slice(0, 6),
      16,
    );
    return (
      (0.2126 * ((value >> 16) & 255) +
        0.7152 * ((value >> 8) & 255) +
        0.0722 * (value & 255)) /
      255
    );
  }

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  // Mirrors the upstream demo: untouched defaults adapt to the page theme.
  const shown = computed(() => {
    const light = theme.value === 'light';
    const tint =
      light && params.tint === DEFAULT_TINT ? '#18181b' : params.tint;
    const tintOpacity =
      light && params.tintOpacity === DEFAULT_TINT_OPACITY
        ? 1
        : params.tintOpacity;
    const opacity = Math.min(1, Math.max(0, tintOpacity));
    const bright =
      luminance(PAGE[theme.value]) * (1 - opacity) + luminance(tint) * opacity >
      0.5;
    const adapt = bright || light;
    return {
      tint,
      tintOpacity,
      textColor:
        params.textColor === DEFAULT_TEXT && adapt
          ? bright
            ? '#18181b'
            : '#fafafa'
          : params.textColor,
      baseColor:
        params.baseColor === DEFAULT_BASE && adapt
          ? bright
            ? '#a1a1aa'
            : '#3f3f46'
          : params.baseColor,
    };
  });

  let paneInstance: Pane | null = null;

  function applyPreset() {
    Object.assign(params, PRESETS[params.preset]);
    paneInstance?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneInstance = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Glass: 'glass',
          Pill: 'pill',
          Crisp: 'crisp',
          Orbit: 'orbit',
        },
      })
      .on('change', applyPreset);
    pane.addBinding(params, 'lineColor', { label: 'light' });
    pane.addBinding(params, 'baseColor', { label: 'edge' });
    pane.addBinding(params, 'tint');
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'tintOpacity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'intensity', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'idleIntensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shineSize', { min: 0, max: 45, step: 1 });
    pane.addBinding(params, 'shineFade', { min: 0, max: 90, step: 1 });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 4, step: 0.1 });
    pane.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'proximity', { min: 50, max: 500, step: 10 });
    pane.addBinding(params, 'speed', { min: 0, max: 2, step: 0.05 });
    pane.addBinding(params, 'followMouse');
    pane.addBinding(params, 'autoAnimate');
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SpecularButton from '~/components/ui/specular-button/SpecularButton.vue';
</script>

<template>
  <SpecularButton
    size=&quot;lg&quot;
    :radius=&quot;18&quot;
    line-color=&quot;#ffffff&quot;
    base-color=&quot;#525252&quot;
    :idle-intensity=&quot;0.35&quot;
    :shine-size=&quot;10&quot;
    :shine-fade=&quot;34&quot;
    :proximity=&quot;250&quot;
    @click=&quot;console.log('clicked')&quot;
  >
    Get Started
  </SpecularButton>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <SpecularButton
        :size="params.size"
        :radius="params.radius"
        :tint="shown.tint"
        :tint-opacity="shown.tintOpacity"
        :blur="params.blur"
        :text-color="shown.textColor"
        :line-color="params.lineColor"
        :base-color="shown.baseColor"
        :intensity="params.intensity"
        :idle-intensity="params.idleIntensity"
        :shine-size="params.shineSize"
        :shine-fade="params.shineFade"
        :thickness="params.thickness"
        :glow="params.glow"
        :speed="params.speed"
        :follow-mouse="params.followMouse"
        :proximity="params.proximity"
        :auto-animate="params.autoAnimate"
        :disabled="params.disabled"
      >
        Get Started
      </SpecularButton>
      <ShaderPane title="Specular Button" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
