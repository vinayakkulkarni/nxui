<script setup lang="ts">
  import { reactive, ref, shallowRef } from 'vue';
  import { useTimeoutFn } from '@vueuse/core';
  import SplitText from '@registry/new-york/split-text/SplitText.vue';
  import {
    isSplitTextPreset,
    splitTextPreset,
  } from '@registry/new-york/split-text/split-text-presets.ts';
  import type {
    SplitTextPresetName,
    SplitTextPresetValues,
  } from '@registry/new-york/split-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const paneRef = shallowRef<Pane | null>(null);
  const replayKey = ref(0);
  const finished = ref(false);
  const initialPreset: SplitTextPresetName = 'rise';

  const look = reactive<SplitTextPresetValues>(splitTextPreset(initialPreset));
  const params = reactive<{
    preset: SplitTextPresetName;
    text: string;
    colorPick: string;
    accentPick: string;
    showCallback: boolean;
  }>({
    preset: initialPreset,
    text: 'Hello, you!',
    colorPick: '#ffffff',
    accentPick: '#ff5a36',
    showCallback: true,
  });

  const { start: hideLater } = useTimeoutFn(
    () => {
      finished.value = false;
    },
    1800,
    { immediate: false },
  );

  function replay() {
    finished.value = false;
    replayKey.value++;
  }

  function onComplete() {
    if (!params.showCallback) return;
    finished.value = true;
    hideLater();
  }

  function applyPreset(name: SplitTextPresetName) {
    Object.assign(look, splitTextPreset(name));
    params.preset = name;
    if (look.accentColor) params.accentPick = look.accentColor;
    paneRef.value?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    params.colorPick = colorMode.value === 'light' ? '#18181b' : '#ffffff';
    pane
      .addBinding(params, 'preset', {
        options: { Rise: 'rise', Flip: 'flip', Blur: 'blur', Wave: 'wave' },
      })
      .on('change', (ev) => {
        if (isSplitTextPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'text').on('change', replay);
    pane
      .addBinding(params, 'colorPick', { label: 'color' })
      .on('change', (ev) => {
        look.color = ev.value;
      });
    pane
      .addBinding(params, 'accentPick', { label: 'accent' })
      .on('change', (ev) => {
        look.accentColor = ev.value;
        replay();
      });
    pane
      .addBinding(look, 'effect', {
        options: {
          Rise: 'rise',
          Fade: 'fade',
          Blur: 'blur',
          Flip: 'flip',
          Pop: 'pop',
          Skew: 'skew',
          Wave: 'wave',
        },
      })
      .on('change', replay);
    pane
      .addBinding(look, 'splitType', {
        options: { Chars: 'chars', Words: 'words', Lines: 'lines' },
      })
      .on('change', replay);
    pane
      .addBinding(look, 'trigger', {
        options: {
          'In view': 'view',
          Load: 'load',
          Hover: 'hover',
          Click: 'click',
        },
      })
      .on('change', replay);
    pane.addBinding(look, 'hoverEffect', {
      options: { None: 'none', Lift: 'lift', Wave: 'wave' },
    });
    pane
      .addBinding(look, 'ease', {
        options: {
          Auto: '',
          'Power out': 'power3.out',
          'Expo out': 'expo.out',
          'Back out': 'back.out(2)',
          Bounce: 'bounce.out',
          Elastic: 'elastic.out(1, 0.3)',
        },
      })
      .on('change', replay);
    pane
      .addBinding(look, 'staggerFrom', {
        options: {
          Start: 'start',
          Center: 'center',
          End: 'end',
          Edges: 'edges',
          Random: 'random',
        },
      })
      .on('change', replay);
    pane
      .addBinding(look, 'delay', {
        label: 'stagger-delay',
        min: 10,
        max: 500,
        step: 5,
      })
      .on('change', replay);
    pane
      .addBinding(look, 'duration', { min: 0.1, max: 3, step: 0.05 })
      .on('change', replay);
    pane
      .addBinding(look, 'loopDelay', { min: 0, max: 5, step: 0.1 })
      .on('change', replay);
    pane.addBinding(look, 'loop').on('change', replay);
    pane.addBinding(look, 'mask').on('change', replay);
    pane.addBinding(params, 'showCallback', { label: 'completion-toast' });
    pane.addButton({ title: 'Replay' }).on('click', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import SplitText from '~/components/ui/split-text/SplitText.vue';

  function onDone() {
    console.log('All letters have animated!');
  }
</script>

<template>
  <SplitText
    text=&quot;Hello, you!&quot;
    class=&quot;text-6xl font-extrabold&quot;
    effect=&quot;rise&quot;
    split-type=&quot;chars&quot;
    :delay=&quot;50&quot;
    :duration=&quot;1.25&quot;
    trigger=&quot;view&quot;
    hover-effect=&quot;lift&quot;
    @letter-animation-complete=&quot;onDone&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground"
    >
      <SplitText
        :key="replayKey"
        :text="params.text"
        :effect="look.effect"
        :split-type="look.splitType"
        :ease="look.ease || undefined"
        :delay="look.delay"
        :duration="look.duration"
        :stagger-from="look.staggerFrom"
        :trigger="look.trigger"
        :hover-effect="look.hoverEffect"
        :loop="look.loop"
        :loop-delay="look.loopDelay"
        :mask="look.mask"
        :color="look.color || undefined"
        :accent-color="look.accentColor || undefined"
        class="font-display text-[2rem] font-extrabold md:text-[5rem]"
        @letter-animation-complete="onComplete"
      />
      <Transition
        enter-from-class="opacity-0 translate-y-2"
        leave-to-class="opacity-0"
        enter-active-class="transition duration-300"
        leave-active-class="transition duration-500"
      >
        <p
          v-if="finished"
          role="status"
          class="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full border bg-card px-4 py-1.5 font-mono text-xs text-muted-foreground shadow-sm"
        >
          Animation finished
        </p>
      </Transition>
      <ShaderPane title="Split Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
