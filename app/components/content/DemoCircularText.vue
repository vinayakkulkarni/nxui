<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import CircularText from '@registry/new-york/circular-text/CircularText.vue';
  import type {
    CircularTextDirection,
    CircularTextHover,
    CircularTextProps,
  } from '@registry/new-york/circular-text/types';
  import type { Pane } from 'tweakpane';

  const LOOK = {
    text: 'VUE*NXUI*COMPONENTS*',
    color: '',
    ringColor: '',
    onHover: 'speedUp' as CircularTextHover,
    direction: 'clockwise' as CircularTextDirection,
    spinDuration: 20,
    draggable: true,
    hoverTilt: 20,
    tilt: 0,
    center: 'arrow',
    size: 200,
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 0,
    startAngle: 0,
    repeat: 1,
    fill: true,
    ring: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    badge: {},
    stamp: {
      text: 'made with care • since 2026 • ',
      color: '#e5484d',
      onHover: 'slowDown',
      direction: 'counterclockwise',
      spinDuration: 30,
      hoverTilt: 12,
      center: 'star',
      size: 220,
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: 0.02,
      repeat: 2,
      fill: false,
      ring: true,
    },
    orbit: {
      text: 'around the world • ',
      onHover: 'slowDown',
      spinDuration: 40,
      hoverTilt: 10,
      tilt: 58,
      center: 'globe',
      size: 300,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: 0.02,
      repeat: 3,
      fill: false,
    },
    bonkers: {
      text: 'spin me ',
      onHover: 'goBonkers',
      spinDuration: 8,
      hoverTilt: 30,
      center: 'none',
      size: 240,
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: 0.02,
      repeat: 4,
      fill: false,
    },
  };

  const CENTER_ICON: Record<string, string> = {
    arrow: 'lucide:arrow-up-right',
    star: 'lucide:star',
    globe: 'lucide:globe',
  };

  const params = reactive({ preset: 'badge', ...LOOK });

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );
  const swatch = reactive({ color: ink.value, ringColor: ink.value });

  let syncing = false;

  function syncSwatch() {
    syncing = true;
    swatch.color = params.color || ink.value;
    swatch.ringColor = params.ringColor || params.color || ink.value;
    paneRef?.refresh();
    syncing = false;
  }

  watch(ink, syncSwatch);

  const ringProps = computed<CircularTextProps>(() => ({
    text: params.text,
    color: params.color,
    ringColor: params.ringColor,
    onHover: params.onHover,
    direction: params.direction,
    spinDuration: params.spinDuration,
    draggable: params.draggable,
    hoverTilt: params.hoverTilt,
    tilt: params.tilt,
    size: params.size,
    fontSize: params.fontSize,
    fontWeight: params.fontWeight,
    letterSpacing: params.letterSpacing,
    startAngle: params.startAngle,
    repeat: params.repeat,
    fill: params.fill,
    ring: params.ring,
  }));

  const centerIcon = computed(() => CENTER_ICON[params.center]);
  const iconSize = computed(() => ({
    width: `${params.size * (params.center === 'arrow' ? 0.3 : 0.22)}px`,
    height: `${params.size * (params.center === 'arrow' ? 0.3 : 0.22)}px`,
  }));

  let paneRef: Pane | null = null;

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    syncSwatch();
  }

  function onColor(value: string) {
    if (syncing) return;
    params.color = value;
  }

  function onRingColor(value: string) {
    if (syncing) return;
    params.ringColor = value;
    params.ring = true;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Badge: 'badge',
          Stamp: 'stamp',
          Orbit: 'orbit',
          Bonkers: 'bonkers',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane
      .addBinding(swatch, 'color')
      .on('change', (event) => onColor(event.value));
    pane
      .addBinding(swatch, 'ringColor')
      .on('change', (event) => onRingColor(event.value));
    pane.addBinding(params, 'onHover', {
      options: {
        'Slow Down': 'slowDown',
        'Speed Up': 'speedUp',
        Pause: 'pause',
        'Go Bonkers': 'goBonkers',
      },
    });
    pane.addBinding(params, 'direction', {
      options: { Clockwise: 'clockwise', Counterclockwise: 'counterclockwise' },
    });
    pane.addBinding(params, 'spinDuration', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'hoverTilt', { min: 0, max: 40, step: 1 });
    pane.addBinding(params, 'tilt', { min: 0, max: 75, step: 1 });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'center', {
      options: { None: 'none', Arrow: 'arrow', Star: 'star', Globe: 'globe' },
    });
    pane.addBinding(params, 'size', { min: 120, max: 360, step: 10 });
    pane.addBinding(params, 'fontSize', { min: 10, max: 40, step: 1 });
    pane.addBinding(params, 'fontWeight', { min: 300, max: 900, step: 100 });
    pane.addBinding(params, 'letterSpacing', {
      min: -0.05,
      max: 0.3,
      step: 0.01,
    });
    pane.addBinding(params, 'startAngle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'repeat', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'fill');
    pane.addBinding(params, 'ring');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import CircularText from '~/components/ui/circular-text/CircularText.vue';
</script>

<template>
  <CircularText
    text=&quot;VUE*NXUI*COMPONENTS*&quot;
    on-hover=&quot;speedUp&quot;
    :spin-duration=&quot;20&quot;
    :hover-tilt=&quot;20&quot;
    draggable
  >
    <Icon name=&quot;lucide:arrow-up-right&quot; class=&quot;size-15&quot; />
  </CircularText>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground"
    >
      <CircularText v-bind="ringProps">
        <Icon
          v-if="centerIcon"
          :name="centerIcon"
          :class="params.center === 'star' ? 'fill-current' : undefined"
          :style="iconSize"
        />
      </CircularText>
      <ShaderPane title="Circular Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
