<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import BlurText from '@registry/new-york/blur-text/BlurText.vue';
  import type { BlurTextProps } from '@registry/new-york/blur-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK: Required<
    Pick<
      BlurTextProps,
      | 'effect'
      | 'animateBy'
      | 'direction'
      | 'staggerFrom'
      | 'trigger'
      | 'delay'
      | 'stepDuration'
      | 'loop'
      | 'loopDelay'
      | 'blur'
      | 'distance'
      | 'focusOnHover'
      | 'fromColor'
    >
  > = {
    fromColor: '',
    effect: 'blur',
    animateBy: 'words',
    direction: 'top',
    staggerFrom: 'start',
    trigger: 'view',
    delay: 200,
    stepDuration: 0.35,
    loop: false,
    loopDelay: 2,
    blur: 10,
    distance: 50,
    focusOnHover: false,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    soft: {},
    focus: {
      effect: 'focus',
      animateBy: 'letters',
      staggerFrom: 'center',
      delay: 35,
      stepDuration: 0.5,
      loop: true,
      loopDelay: 1.6,
      blur: 14,
      distance: 0,
    },
    tilt: {
      fromColor: '#ff5a36',
      effect: 'tilt',
      animateBy: 'letters',
      direction: 'bottom',
      delay: 40,
      stepDuration: 0.45,
      blur: 8,
      distance: 40,
    },
    drift: {
      effect: 'drift',
      direction: 'left',
      staggerFrom: 'random',
      delay: 110,
      stepDuration: 0.5,
      blur: 12,
      distance: 70,
      focusOnHover: true,
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'soft',
    ...LOOK,
    textColor: '#ffffff',
    fromColor: '#ffffff',
  });

  const renderKey = ref(0);
  const completed = ref(0);
  let paneRef: Pane | null = null;

  const textColor = computed(() =>
    params.textColor && params.textColor !== ink.value
      ? params.textColor
      : undefined,
  );
  const fromColor = computed(() =>
    params.fromColor && params.fromColor !== ink.value
      ? params.fromColor
      : undefined,
  );

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.textColor === previous) params.textColor = value;
      if (!previous || params.fromColor === previous) {
        params.fromColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  watch(
    [
      () => params.effect,
      () => params.animateBy,
      () => params.direction,
      () => params.staggerFrom,
      () => params.trigger,
      () => params.delay,
      () => params.stepDuration,
      () => params.loop,
      () => params.blur,
      () => params.distance,
    ],
    () => renderKey.value++,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, { fromColor: ink.value }, PRESETS[name]);
    renderKey.value++;
    paneRef?.refresh();
  }

  function onComplete() {
    completed.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: { Soft: 'soft', Focus: 'focus', Tilt: 'tilt', Drift: 'drift' },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'textColor', { label: 'text color' });
    pane.addBinding(params, 'fromColor', { label: 'from color' });
    pane.addBinding(params, 'effect', {
      options: {
        Blur: 'blur',
        Zoom: 'zoom',
        Tilt: 'tilt',
        Focus: 'focus',
        Drift: 'drift',
      },
    });
    pane.addBinding(params, 'animateBy', {
      label: 'animate by',
      options: { Words: 'words', Letters: 'letters' },
    });
    pane.addBinding(params, 'direction', {
      options: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    });
    pane.addBinding(params, 'staggerFrom', {
      label: 'stagger from',
      options: {
        Start: 'start',
        Center: 'center',
        End: 'end',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'trigger', {
      options: { View: 'view', Load: 'load', Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'delay', { min: 20, max: 500, step: 10 });
    pane.addBinding(params, 'stepDuration', {
      label: 'step duration',
      min: 0.1,
      max: 1,
      step: 0.05,
    });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'loopDelay', {
      label: 'loop delay',
      min: 0.2,
      max: 5,
      step: 0.1,
    });
    pane.addBinding(params, 'blur', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'distance', { min: 0, max: 120, step: 5 });
    pane.addBinding(params, 'focusOnHover', { label: 'focus on hover' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import BlurText from '~/components/ui/blur-text/BlurText.vue';
</script>

<template>
  <BlurText
    text=&quot;Isn't this so cool?!&quot;
    effect=&quot;blur&quot;
    animate-by=&quot;words&quot;
    direction=&quot;top&quot;
    :delay=&quot;200&quot;
    :step-duration=&quot;0.35&quot;
    class=&quot;text-5xl font-extrabold&quot;
    @animation-complete=&quot;onComplete&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <BlurText
        :key="renderKey"
        text="Isn't this so cool?!"
        :effect="params.effect"
        :animate-by="params.animateBy"
        :direction="params.direction"
        :stagger-from="params.staggerFrom"
        :trigger="params.trigger"
        :delay="params.delay"
        :step-duration="params.stepDuration"
        :loop="params.loop"
        :loop-delay="params.loopDelay"
        :blur="params.blur"
        :distance="params.distance"
        :focus-on-hover="params.focusOnHover"
        :color="textColor"
        :from-color="fromColor"
        class="justify-center text-center text-[2rem] font-extrabold text-foreground sm:text-[5rem]"
        @animation-complete="onComplete"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        {{ completed ? `animation finished ×${completed}` : 'animating in…' }}
      </p>
      <ShaderPane title="Blur Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
