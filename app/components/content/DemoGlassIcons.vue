<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import GlassIcons from '@registry/new-york/glass-icons/GlassIcons.vue';
  import type { Pane } from 'tweakpane';
  import type {
    GlassIconsItem,
    GlassIconsProps,
  } from '@registry/new-york/glass-icons/types';

  const colorMode = useColorMode();
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const APPS: GlassIconsItem[] = [
    { icon: 'lucide:folder', color: 'blue', label: 'Files' },
    { icon: 'lucide:book', color: 'purple', label: 'Books' },
    { icon: 'lucide:heart', color: 'red', label: 'Health' },
    { icon: 'lucide:cloud', color: 'indigo', label: 'Weather' },
    { icon: 'lucide:sticky-note', color: 'orange', label: 'Notes' },
    { icon: 'lucide:chart-column', color: 'green', label: 'Stats' },
  ];

  const MONO: GlassIconsItem[] = APPS.map((item) => ({
    ...item,
    color: 'graphite',
  }));

  const SOCIAL: GlassIconsItem[] = [
    {
      icon: 'lucide:github',
      color: 'linear-gradient(135deg, #4a4752, #1d1b22)',
      label: 'GitHub',
    },
    {
      icon: 'lucide:twitter',
      color: 'linear-gradient(135deg, #3d3b44, #121116)',
      label: 'X',
    },
    {
      icon: 'lucide:linkedin',
      color: 'linear-gradient(135deg, #2f8ae0, #0a5bb8)',
      label: 'LinkedIn',
    },
    {
      icon: 'lucide:instagram',
      color:
        'linear-gradient(135deg, #feda75, #fa7e1e 30%, #d62976 60%, #962fbf 85%)',
      label: 'Instagram',
    },
    {
      icon: 'lucide:youtube',
      color: 'linear-gradient(135deg, #ff4e45, #c4120a)',
      label: 'YouTube',
    },
    {
      icon: 'lucide:dribbble',
      color: 'linear-gradient(135deg, #f58bb8, #d6427f)',
      label: 'Dribbble',
    },
  ];

  const DEFAULTS: Required<
    Omit<GlassIconsProps, 'items' | 'class' | 'theme'>
  > & {
    preset: string;
  } = {
    preset: 'apps',
    size: 82,
    gap: 66,
    columns: 3,
    roundness: 0.6,
    refraction: 0.8,
    bevel: 0.6,
    dispersion: 0,
    frost: 0.2,
    shine: 0.85,
    tint: '#dfdfdf',
    tintOpacity: 0.2,
    iconColor: '',
    plate: 'tilt',
    tilt: 30,
    spread: 0.5,
    hover: 'press',
    parallax: 1,
    labels: 'hover',
    intro: true,
  };

  const PRESETS: Record<string, Partial<typeof DEFAULTS>> = {
    apps: {},
    mono: {},
    social: {
      size: 56,
      gap: 22,
      columns: 6,
      roundness: 1,
      plate: 'circle',
      spread: 0.12,
    },
    dock: {
      size: 60,
      gap: 16,
      columns: 6,
      roundness: 0.42,
      plate: 'offset',
      spread: 0.35,
      hover: 'float',
    },
    clear: {
      plate: 'none',
      refraction: 0.9,
      dispersion: 0.6,
      frost: 0.15,
      tintOpacity: 0.06,
    },
  };

  const params = reactive({ ...DEFAULTS });
  // Tweakpane needs a valid color, so the picker shows the resolved ink and
  // only writes back to iconColor when the user picks one.
  const picker = reactive({ iconColor: '#ffffff' });
  const replay = ref(0);
  let paneRef: Pane | null = null;

  const items = computed(() => {
    if (params.preset === 'mono') return MONO;
    if (params.preset === 'social') return SOCIAL;
    return APPS;
  });

  const ink = computed(
    () =>
      params.iconColor ||
      (theme.value === 'light' && params.plate === 'none'
        ? '#27272a'
        : '#ffffff'),
  );

  const backdrop = computed(() => {
    if (params.preset !== 'clear') return undefined;
    const id =
      theme.value === 'light'
        ? '1506905925346-21bda4d32df4'
        : '1519681393784-d120267933ba';
    return {
      background: `url(https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80) center / cover`,
    };
  });

  function applyPreset(name: string) {
    Object.assign(params, DEFAULTS, PRESETS[name], { preset: name });
    picker.iconColor = ink.value;
    replay.value += 1;
    paneRef?.refresh();
  }

  function onIconColor(value: string) {
    if (value !== ink.value) params.iconColor = value;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Apps: 'apps',
          Mono: 'mono',
          Social: 'social',
          Dock: 'dock',
          Clear: 'clear',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'plate', {
      options: {
        Tilt: 'tilt',
        Offset: 'offset',
        Circle: 'circle',
        None: 'none',
      },
    });
    pane.addBinding(params, 'hover', {
      options: { Lift: 'lift', Float: 'float', Press: 'press', None: 'none' },
    });
    pane.addBinding(params, 'labels', {
      options: { 'On Hover': 'hover', Always: 'always', Hidden: 'none' },
    });
    pane.addBinding(params, 'tint');
    pane
      .addBinding(picker, 'iconColor')
      .on('change', (event) => onIconColor(event.value));
    pane.addBinding(params, 'size', { min: 40, max: 120, step: 2 });
    pane.addBinding(params, 'gap', { min: 8, max: 96, step: 2 });
    pane.addBinding(params, 'columns', { min: 1, max: 6, step: 1 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.02 });
    pane.addBinding(params, 'refraction', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'bevel', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'frost', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shine', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tintOpacity', { min: 0, max: 0.6, step: 0.02 });
    pane.addBinding(params, 'tilt', { min: -45, max: 45, step: 1 });
    pane.addBinding(params, 'spread', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'parallax', { min: 0, max: 1, step: 0.05 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import GlassIcons from '~/components/ui/glass-icons/GlassIcons.vue';
  import type { GlassIconsItem } from '~/components/ui/glass-icons/types';

  const items: GlassIconsItem[] = [
    { icon: 'lucide:folder', color: 'blue', label: 'Files' },
    { icon: 'lucide:book', color: 'purple', label: 'Books' },
    { icon: 'lucide:heart', color: 'red', label: 'Health' },
    { icon: 'lucide:cloud', color: 'indigo', label: 'Weather' },
    { icon: 'lucide:sticky-note', color: 'orange', label: 'Notes' },
    { icon: 'lucide:chart-column', color: 'green', label: 'Stats' },
  ];
</script>

<template>
  <GlassIcons
    :items=&quot;items&quot;
    :size=&quot;82&quot;
    :gap=&quot;66&quot;
    :columns=&quot;3&quot;
    :refraction=&quot;0.8&quot;
    :frost=&quot;0.2&quot;
    tint=&quot;#dfdfdf&quot;
    :tint-opacity=&quot;0.2&quot;
    plate=&quot;tilt&quot;
    hover=&quot;press&quot;
    labels=&quot;hover&quot;
    theme=&quot;dark&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
      :style="backdrop"
    >
      <GlassIcons
        :key="`${params.preset}-${replay}`"
        :items="items"
        :size="params.size"
        :gap="params.gap"
        :columns="params.columns"
        :roundness="params.roundness"
        :refraction="params.refraction"
        :bevel="params.bevel"
        :dispersion="params.dispersion"
        :frost="params.frost"
        :shine="params.shine"
        :tint="params.tint"
        :tint-opacity="params.tintOpacity"
        :icon-color="ink"
        :plate="params.plate"
        :tilt="params.tilt"
        :spread="params.spread"
        :hover="params.hover"
        :parallax="params.parallax"
        :labels="params.labels"
        :intro="params.intro"
        :theme="theme"
      />
      <ShaderPane title="Glass Icons" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
