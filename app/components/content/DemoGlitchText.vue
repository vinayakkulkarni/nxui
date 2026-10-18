<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import GlitchText from '@registry/new-york/glitch-text/GlitchText.vue';
  import type {
    GlitchTextProps,
    GlitchTextTrigger,
  } from '@registry/new-york/glitch-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LABELS: Record<GlitchTextTrigger, string> = {
    always: 'nxui',
    hover: 'Hover Me',
    click: 'Click Me',
  };

  const LOOK: Required<
    Pick<
      GlitchTextProps,
      | 'shadowColors'
      | 'mode'
      | 'trigger'
      | 'speed'
      | 'intensity'
      | 'burstDuration'
      | 'flicker'
      | 'offset'
      | 'skew'
      | 'fontWeight'
      | 'enableShadows'
    >
  > = {
    shadowColors: ['#ff0000', '#00ffff'],
    mode: 'slices',
    trigger: 'always',
    speed: 1,
    intensity: 0.5,
    burstDuration: 0.6,
    flicker: false,
    offset: 10,
    skew: 0,
    fontWeight: 900,
    enableShadows: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    rgb: {
      shadowColors: ['#ff4d2e', '#8b8b96'],
      mode: 'rgb',
      intensity: 0.6,
      flicker: true,
      offset: 12,
      skew: 6,
      fontWeight: 800,
    },
    scan: {
      mode: 'scan',
      speed: 1.2,
      intensity: 0.7,
      offset: 26,
      fontWeight: 300,
      enableShadows: false,
    },
    burst: {
      shadowColors: ['#ff4d2e', '#ff4d2e'],
      mode: 'noise',
      trigger: 'click',
      intensity: 0.3,
      burstDuration: 0.9,
      flicker: true,
      offset: 14,
      skew: 10,
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    shadowA: LOOK.shadowColors[0],
    shadowB: LOOK.shadowColors[1],
    fontSize: 0,
    textColor: '#ffffff',
  });

  const stageRef = ref<HTMLDivElement | null>(null);
  const renderKey = ref(0);
  let paneRef: Pane | null = null;

  const textColor = computed(() =>
    params.textColor && params.textColor !== ink.value
      ? params.textColor
      : undefined,
  );
  const shadowColors = computed<[string, string]>(() => [
    params.shadowA,
    params.shadowB,
  ]);
  const label = computed(() => LABELS[params.trigger]);

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.textColor === previous) params.textColor = value;
      paneRef?.refresh();
    },
    { immediate: true },
  );

  watch(
    () => params.trigger,
    () => renderKey.value++,
  );

  function applyPreset(name: string) {
    const look = { ...LOOK, ...PRESETS[name] };
    Object.assign(params, look, {
      shadowA: look.shadowColors[0],
      shadowB: look.shadowColors[1],
      fontSize: 0,
    });
    renderKey.value++;
    paneRef?.refresh();
    if (PRESETS[name]?.trigger === 'click') {
      setTimeout(() => {
        stageRef.value?.querySelector<HTMLElement>('.glitch')?.click();
      }, 450);
    }
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          RGB: 'rgb',
          Scan: 'scan',
          Burst: 'burst',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'textColor', { label: 'text color' });
    pane.addBinding(params, 'shadowA', { label: 'shadow color 1' });
    pane.addBinding(params, 'shadowB', { label: 'shadow color 2' });
    pane.addBinding(params, 'mode', {
      options: { Slices: 'slices', RGB: 'rgb', Scan: 'scan', Noise: 'noise' },
    });
    pane.addBinding(params, 'trigger', {
      options: { Always: 'always', Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'speed', {
      label: 'refresh delay',
      min: 0.1,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'intensity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'burstDuration', {
      label: 'burst duration',
      min: 0.2,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'flicker');
    pane.addBinding(params, 'offset', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'skew', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'fontSize', {
      label: 'font size (0 = auto)',
      min: 0,
      max: 160,
      step: 4,
    });
    pane.addBinding(params, 'fontWeight', {
      label: 'font weight',
      min: 100,
      max: 900,
      step: 100,
    });
    pane.addBinding(params, 'enableShadows', { label: 'glitch colors' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GlitchText from '~/components/ui/glitch-text/GlitchText.vue';
</script>

<template>
  <GlitchText
    text=&quot;nxui&quot;
    mode=&quot;slices&quot;
    trigger=&quot;always&quot;
    :speed=&quot;1&quot;
    :intensity=&quot;0.5&quot;
    :offset=&quot;10&quot;
    :enable-shadows=&quot;true&quot;
  />
</template>`"
  >
    <div
      ref="stageRef"
      class="flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground"
    >
      <GlitchText
        :key="renderKey"
        :text="label"
        :mode="params.mode"
        :trigger="params.trigger"
        :speed="params.speed"
        :intensity="params.intensity"
        :burst-duration="params.burstDuration"
        :flicker="params.flicker"
        :offset="params.offset"
        :skew="params.skew"
        :font-size="params.fontSize || undefined"
        :font-weight="params.fontWeight"
        :enable-shadows="params.enableShadows"
        :shadow-colors="shadowColors"
        :color="textColor"
      />
      <ShaderPane title="Glitch Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
