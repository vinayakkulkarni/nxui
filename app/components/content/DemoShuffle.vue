<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import Shuffle from '@registry/new-york/shuffle/Shuffle.vue';
  import type { ShuffleProps } from '@registry/new-york/shuffle/types';
  import type { Pane } from 'tweakpane';

  useHead({
    link: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
      },
    ],
  });

  const colorMode = useColorMode();

  const LOOK: Required<
    Pick<
      ShuffleProps,
      | 'effect'
      | 'shuffleDirection'
      | 'animationMode'
      | 'duration'
      | 'shuffleTimes'
      | 'stagger'
      | 'maxDelay'
      | 'scrambleCharset'
      | 'motionBlur'
      | 'hoverRadius'
      | 'accentColor'
      | 'ease'
    >
  > = {
    effect: 'slide',
    shuffleDirection: 'right',
    animationMode: 'evenodd',
    ease: 'power3.out',
    duration: 0.35,
    shuffleTimes: 1,
    stagger: 0.03,
    maxDelay: 0,
    scrambleCharset: '',
    motionBlur: false,
    hoverRadius: 0,
    accentColor: '',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    flip: {
      effect: 'flip',
      shuffleDirection: 'down',
      animationMode: 'sequence',
      ease: 'power2.out',
      duration: 1.1,
      shuffleTimes: 7,
      stagger: 0.07,
      scrambleCharset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    },
    blur: {
      effect: 'blur',
      shuffleDirection: 'up',
      animationMode: 'center',
      ease: 'expo.out',
      duration: 1.5,
      shuffleTimes: 14,
      stagger: 0.06,
      scrambleCharset: '0123456789#%&*+=?',
    },
    hover: {
      shuffleDirection: 'down',
      animationMode: 'random',
      ease: 'expo.out',
      duration: 0.9,
      shuffleTimes: 5,
      maxDelay: 0.45,
      scrambleCharset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      motionBlur: true,
      hoverRadius: 120,
      accentColor: '#ff5a36',
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    color: '#ffffff',
    accentColor: '#ffffff',
    colorFrom: '#ffffff',
    colorTo: '#ffffff',
    loop: false,
    loopDelay: 0,
    triggerOnHover: true,
  });

  let paneRef: Pane | null = null;

  watch(
    ink,
    (value, previous) => {
      for (const key of [
        'color',
        'accentColor',
        'colorFrom',
        'colorTo',
      ] as const) {
        if (!previous || params[key] === previous) params[key] = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function onlyIfSet(value: string) {
    return value && value !== ink.value ? value : '';
  }

  const colors = computed(() => ({
    color: onlyIfSet(params.color),
    accentColor: onlyIfSet(params.accentColor),
    colorFrom: onlyIfSet(params.colorFrom),
    colorTo: onlyIfSet(params.colorTo),
  }));

  function applyPreset(name: string) {
    Object.assign(params, LOOK, { accentColor: ink.value }, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Flip: 'flip',
          Blur: 'blur',
          Hover: 'hover',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'accentColor', { label: 'accent' });
    pane.addBinding(params, 'colorFrom', { label: 'start color' });
    pane.addBinding(params, 'colorTo', { label: 'end color' });
    pane.addBinding(params, 'effect', {
      options: { Slide: 'slide', Flip: 'flip', Blur: 'blur' },
    });
    pane.addBinding(params, 'shuffleDirection', {
      label: 'direction',
      options: { Right: 'right', Left: 'left', Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'animationMode', {
      label: 'mode',
      options: {
        'Even / Odd': 'evenodd',
        Sequence: 'sequence',
        Center: 'center',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'ease', {
      options: {
        'power2.out': 'power2.out',
        'power3.out': 'power3.out',
        'back.out(1.1)': 'back.out(1.1)',
        'back.out(2)': 'back.out(2)',
        'expo.out': 'expo.out',
      },
    });
    pane.addBinding(params, 'duration', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'shuffleTimes', { min: 1, max: 16, step: 1 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.2, step: 0.01 });
    pane.addBinding(params, 'maxDelay', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'loopDelay', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'scrambleCharset', { label: 'scramble' });
    pane.addBinding(params, 'motionBlur');
    pane.addBinding(params, 'triggerOnHover', { label: 'hover replay' });
    pane.addBinding(params, 'hoverRadius', { min: 0, max: 300, step: 10 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Shuffle from '~/components/ui/shuffle/Shuffle.vue';
</script>

<template>
  <Shuffle
    text=&quot;Vue nxui&quot;
    effect=&quot;slide&quot;
    shuffle-direction=&quot;right&quot;
    animation-mode=&quot;evenodd&quot;
    ease=&quot;power3.out&quot;
    :duration=&quot;0.35&quot;
    :shuffle-times=&quot;1&quot;
    :stagger=&quot;0.03&quot;
    :trigger-on-hover=&quot;true&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <Shuffle
        text="Vue nxui"
        :effect="params.effect"
        :shuffle-direction="params.shuffleDirection"
        :animation-mode="params.animationMode"
        :ease="params.ease"
        :duration="params.duration"
        :shuffle-times="params.shuffleTimes"
        :stagger="params.stagger"
        :max-delay="params.maxDelay"
        :loop="params.loop"
        :loop-delay="params.loopDelay"
        :scramble-charset="params.scrambleCharset"
        :motion-blur="params.motionBlur"
        :trigger-on-hover="params.triggerOnHover"
        :hover-radius="params.hoverRadius"
        :color="colors.color"
        :accent-color="colors.accentColor"
        :color-from="colors.colorFrom"
        :color-to="colors.colorTo"
        class="text-foreground"
      />
      <ShaderPane title="Shuffle" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
