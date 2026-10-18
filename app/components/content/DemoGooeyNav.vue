<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import GooeyNav from '@registry/new-york/gooey-nav/GooeyNav.vue';
  import type {
    GooeyNavItem,
    GooeyNavProps,
  } from '@registry/new-york/gooey-nav/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const themePill = computed(() =>
    theme.value === 'light' ? '#27272a' : '#f4f4f5',
  );

  const LABELS = ['Home', 'Work', 'About', 'Contact'];
  const ICONS = [
    'lucide:house',
    'lucide:briefcase',
    'lucide:user',
    'lucide:mail',
  ];
  const EMBER = ['#ff5a1f', '#ff8a3a', '#ffb020'];
  const NO_COLORS: string[] = [];

  const FEEL = {
    icons: false,
    palette: 'none',
    particleCount: 15,
    spread: 56,
    timeVariance: 300,
    animationTime: 600,
    gooeyness: 0.5,
    wobble: 0.5,
  };

  const params = reactive<
    Required<
      Pick<
        GooeyNavProps,
        | 'size'
        | 'frame'
        | 'hoverEffect'
        | 'particleCount'
        | 'spread'
        | 'timeVariance'
        | 'animationTime'
        | 'gooeyness'
        | 'wobble'
      >
    > & { preset: string; icons: boolean; palette: string; color: string }
  >({
    preset: 'classic',
    ...FEEL,
    color: '#f4f4f5',
    size: 'md',
    frame: true,
    hoverEffect: true,
  });
  const customColor = ref(false);
  const active = ref(0);
  let paneRef: Pane | null = null;

  const PRESETS: Record<string, Partial<typeof params>> = {
    classic: {},
    accent: { color: '#ff5a1f', palette: 'ember' },
    splash: {
      particleCount: 24,
      spread: 84,
      gooeyness: 0.65,
      timeVariance: 450,
    },
    calm: { particleCount: 8, spread: 28, wobble: 0.2, animationTime: 520 },
    icons: { icons: true },
  };

  function applyPreset(name: string) {
    Object.assign(params, { ...FEEL, color: themePill.value }, PRESETS[name]);
    customColor.value = name === 'accent';
    paneRef?.refresh();
  }

  watch(
    themePill,
    (value) => {
      if (customColor.value) return;
      params.color = value;
      paneRef?.refresh();
    },
    { immediate: true },
  );

  const items = computed<GooeyNavItem[]>(() =>
    LABELS.map((label, index) => ({
      label,
      href: '#',
      icon: params.icons ? ICONS[index] : undefined,
    })),
  );
  const pill = computed(() => (customColor.value ? params.color : undefined));
  const colors = computed(() =>
    params.palette === 'ember' ? EMBER : NO_COLORS,
  );

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Accent: 'accent',
          Splash: 'splash',
          Calm: 'calm',
          Icons: 'icons',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane
      .addBinding(params, 'color', { label: 'pill color' })
      .on('change', (event) => {
        if (event.last) customColor.value = true;
      });
    pane.addBinding(params, 'size', {
      options: { Small: 'sm', Medium: 'md', Large: 'lg' },
    });
    pane.addBinding(params, 'particleCount', {
      label: 'particles',
      min: 1,
      max: 32,
      step: 1,
    });
    pane.addBinding(params, 'spread', { min: 0, max: 120, step: 2 });
    pane.addBinding(params, 'animationTime', {
      label: 'time (ms)',
      min: 200,
      max: 1500,
      step: 50,
    });
    pane.addBinding(params, 'timeVariance', {
      label: 'variance',
      min: 0,
      max: 1000,
      step: 50,
    });
    pane.addBinding(params, 'gooeyness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wobble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'frame');
    pane.addBinding(params, 'icons');
    pane.addBinding(params, 'hoverEffect', { label: 'hover effect' });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import GooeyNav from '~/components/ui/gooey-nav/GooeyNav.vue';

  const items = [
    { label: 'Home', href: '#' },
    { label: 'Work', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
  ];
  const active = ref(0);
</script>

<template>
  <GooeyNav
    v-model:active-index=&quot;active&quot;
    :items=&quot;items&quot;
    theme=&quot;dark&quot;
    size=&quot;md&quot;
    :particle-count=&quot;15&quot;
    :spread=&quot;56&quot;
    :animation-time=&quot;600&quot;
    :time-variance=&quot;300&quot;
    :gooeyness=&quot;0.5&quot;
    :wobble=&quot;0.5&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <GooeyNav
        v-model:active-index="active"
        :items="items"
        :theme="theme"
        :color="pill"
        :colors="colors"
        :size="params.size"
        :frame="params.frame"
        :hover-effect="params.hoverEffect"
        :particle-count="params.particleCount"
        :spread="params.spread"
        :time-variance="params.timeVariance"
        :animation-time="params.animationTime"
        :gooeyness="params.gooeyness"
        :wobble="params.wobble"
      />
      <ShaderPane title="Gooey Nav" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
