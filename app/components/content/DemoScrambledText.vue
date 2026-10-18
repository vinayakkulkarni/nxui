<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import ScrambledText from '@registry/new-york/scrambled-text/ScrambledText.vue';
  import type { ScrambledTextProps } from '@registry/new-york/scrambled-text/types';
  import type { Pane } from 'tweakpane';

  useHead({
    link: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;700&family=Geist+Mono:wght@400;700&display=swap',
      },
    ],
  });

  const colorMode = useColorMode();

  const LOOK: Required<
    Pick<
      ScrambledTextProps,
      | 'color'
      | 'scrambleColor'
      | 'effect'
      | 'radius'
      | 'strength'
      | 'trail'
      | 'duration'
      | 'speed'
      | 'clickBurst'
      | 'fontFamily'
      | 'scrambleChars'
    >
  > = {
    color: '',
    scrambleColor: '',
    effect: 'scramble',
    radius: 100,
    strength: 1,
    trail: 0.6,
    duration: 1.2,
    speed: 0.5,
    clickBurst: true,
    fontFamily: '',
    scrambleChars: '.:',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    decode: {},
    float: {
      effect: 'lift',
      radius: 130,
      trail: 0.9,
      duration: 0.9,
      speed: 0.8,
      fontFamily: 'Geist, sans-serif',
      scrambleChars: '·•',
    },
    haze: {
      effect: 'blur',
      radius: 120,
      strength: 1.1,
      trail: 1.4,
      duration: 1.4,
      speed: 0.4,
      fontFamily: 'Georgia, serif',
      scrambleChars: '░▒',
    },
    lens: {
      scrambleColor: '#ff5a1f',
      effect: 'magnify',
      radius: 90,
      trail: 0.35,
      duration: 0.8,
      speed: 1,
      fontFamily: '"Geist Mono", monospace',
      scrambleChars: '<>/*',
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#27272a' : '#ffffff',
  );

  const params = reactive({
    preset: 'decode',
    ...LOOK,
    color: '#ffffff',
    scrambleColor: '#ffffff',
    intro: true,
  });

  const renderKey = ref(0);
  let paneRef: Pane | null = null;

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.color === previous) params.color = value;
      if (!previous || params.scrambleColor === previous) {
        params.scrambleColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function onlyIfSet(value: string) {
    return value && value !== ink.value ? value : '';
  }

  function applyPreset(name: string) {
    Object.assign(
      params,
      LOOK,
      { color: ink.value, scrambleColor: ink.value },
      PRESETS[name],
    );
    renderKey.value++;
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Decode: 'decode',
          Float: 'float',
          Haze: 'haze',
          Lens: 'lens',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'scrambleColor', { label: 'scramble color' });
    pane.addBinding(params, 'effect', {
      options: {
        Scramble: 'scramble',
        Lift: 'lift',
        Blur: 'blur',
        Magnify: 'magnify',
      },
    });
    pane.addBinding(params, 'radius', { min: 20, max: 300, step: 10 });
    pane.addBinding(params, 'strength', { min: 0.2, max: 2, step: 0.1 });
    pane.addBinding(params, 'trail', { min: 0.1, max: 3, step: 0.05 });
    pane.addBinding(params, 'duration', { min: 0.1, max: 5, step: 0.1 });
    pane.addBinding(params, 'speed', { min: 0.1, max: 2, step: 0.1 });
    pane.addBinding(params, 'clickBurst', { label: 'click burst' });
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'fontFamily', {
      label: 'font',
      options: {
        Mono: '',
        Sans: 'Geist, sans-serif',
        Serif: 'Georgia, serif',
        'Geist Mono': '"Geist Mono", monospace',
      },
    });
    pane.addBinding(params, 'scrambleChars', { label: 'scramble chars' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ScrambledText from '~/components/ui/scrambled-text/ScrambledText.vue';
</script>

<template>
  <ScrambledText
    text=&quot;Once you hover over me, you will see the effect in action!&quot;
    effect=&quot;magnify&quot;
    :radius=&quot;90&quot;
    :duration=&quot;0.8&quot;
    :speed=&quot;1&quot;
    scramble-chars=&quot;<>/*&quot;
    scramble-color=&quot;#ff5a1f&quot;
    :click-burst=&quot;true&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <ScrambledText
        :key="renderKey"
        text="Once you hover over me, you will see the effect in action! You can customize the radius, duration, and speed of the scramble effect."
        :effect="params.effect"
        :radius="params.radius"
        :strength="params.strength"
        :trail="params.trail"
        :duration="params.duration"
        :speed="params.speed"
        :click-burst="params.clickBurst"
        :intro="params.intro"
        :scramble-chars="params.scrambleChars"
        :font-family="params.fontFamily"
        :color="onlyIfSet(params.color)"
        :scramble-color="onlyIfSet(params.scrambleColor)"
        class="max-w-150 text-base font-bold text-foreground"
      />
      <ShaderPane title="Scrambled Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
