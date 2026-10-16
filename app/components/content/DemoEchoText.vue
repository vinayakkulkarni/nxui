<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import EchoText from '@registry/new-york/echo-text/EchoText.vue';
  import type {
    EchoTextMode,
    EchoTextProps,
  } from '@registry/new-york/echo-text/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_INK = '#ffffff';
  const DEFAULT_MODE: EchoTextMode = 'both';

  const ECHO_LOOK: Required<
    Pick<
      EchoTextProps,
      | 'trail'
      | 'clickBurst'
      | 'echoes'
      | 'lag'
      | 'offset'
      | 'direction'
      | 'fade'
      | 'blur'
      | 'echoStyle'
      | 'echoScale'
      | 'duration'
      | 'ease'
    >
  > = {
    trail: 'pointer',
    clickBurst: true,
    echoes: 12,
    lag: 0.24,
    offset: 36,
    direction: 'right',
    fade: 0.72,
    blur: 3,
    echoStyle: 'solid',
    echoScale: 1,
    duration: 900,
    ease: 'ease-out',
  };

  const LOOK = {
    palette: 'tint',
    tint: '#7dd3fc',
    rampFront: DEFAULT_INK,
    rampBack: '#ff7a45',
    ...ECHO_LOOK,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    ghost: {},
    orbit: {
      palette: 'ramp',
      trail: 'auto',
      echoes: 10,
      lag: 0.2,
      offset: 44,
      direction: 'diagonal',
      fade: 0.84,
      blur: 0,
      echoStyle: 'outline',
      duration: 1100,
      ease: 'snappy',
    },
    wake: {
      palette: 'ramp',
      rampBack: '#3ddc97',
      trail: 'scroll',
      echoes: 16,
      lag: 0.3,
      offset: 24,
      direction: 'down',
      fade: 0.82,
      blur: 5,
      duration: 1200,
      ease: 'ease-in-out',
    },
    zoom: {
      palette: 'ramp',
      rampBack: '#5b8cff',
      trail: 'auto',
      echoes: 7,
      lag: 0.2,
      offset: 30,
      direction: 'up',
      fade: 0.75,
      blur: 0,
      echoScale: 1.4,
      duration: 1000,
    },
  };

  const params = reactive({
    preset: 'ghost',
    text: 'Motion Echo',
    textColor: DEFAULT_INK,
    ...LOOK,
    mode: DEFAULT_MODE,
    cursorRadius: 320,
    fontSize: 'clamp(3rem, 9vw, 7rem)',
    fontWeight: 800,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;

  const textColor = computed(() =>
    params.textColor === DEFAULT_INK ? 'currentColor' : params.textColor,
  );
  const tint = computed(() =>
    params.palette === 'tint' ? params.tint : false,
  );
  const echoColors = computed<[string, string] | undefined>(() =>
    params.palette === 'ramp'
      ? [
          params.rampFront === DEFAULT_INK ? 'currentColor' : params.rampFront,
          params.rampBack,
        ]
      : undefined,
  );

  function replay() {
    replayKey.value++;
  }

  function applyPreset() {
    Object.assign(params, LOOK, PRESETS[params.preset]);
    paneRef?.refresh();
    replay();
  }

  function useTint() {
    params.palette = 'tint';
    paneRef?.refresh();
  }

  function useRamp() {
    params.palette = 'ramp';
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: { Ghost: 'ghost', Orbit: 'orbit', Wake: 'wake', Zoom: 'zoom' },
      })
      .on('change', applyPreset);
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'textColor');
    pane.addBinding(params, 'palette', {
      label: 'echo colors',
      options: { Tint: 'tint', Ramp: 'ramp', Plain: 'plain' },
    });
    pane
      .addBinding(params, 'tint', { label: 'echo tint' })
      .on('change', useTint);
    pane.addBinding(params, 'rampFront').on('change', useRamp);
    pane.addBinding(params, 'rampBack').on('change', useRamp);
    pane.addBinding(params, 'trail', {
      options: { Pointer: 'pointer', Auto: 'auto', Scroll: 'scroll' },
    });
    pane
      .addBinding(params, 'mode', {
        options: {
          'Entrance + Trail': 'both',
          'Entrance Only': 'entrance',
          'Trail Only': 'pointer',
        },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'direction', {
        options: {
          Right: 'right',
          Left: 'left',
          Up: 'up',
          Down: 'down',
          Diagonal: 'diagonal',
        },
      })
      .on('change', replay);
    pane
      .addBinding(params, 'ease', {
        options: {
          'Ease Out': 'ease-out',
          'Ease In Out': 'ease-in-out',
          Snappy: 'snappy',
          Linear: 'linear',
        },
      })
      .on('change', replay);
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'echoes', { min: 2, max: 18, step: 1 });
    pane.addBinding(params, 'lag', { min: 0.05, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'offset', { min: 8, max: 56, step: 1 });
    pane
      .addBinding(params, 'duration', { min: 300, max: 1600, step: 50 })
      .on('change', replay);
    pane.addBinding(params, 'cursorRadius', { min: 80, max: 900, step: 10 });
    pane.addBinding(params, 'echoStyle', {
      options: { Solid: 'solid', Outline: 'outline' },
    });
    pane.addBinding(params, 'fontSize', {
      label: 'size',
      options: {
        Compact: 'clamp(2.5rem, 7vw, 5.5rem)',
        Hero: 'clamp(3rem, 9vw, 7rem)',
        Billboard: 'clamp(4rem, 12vw, 9rem)',
      },
    });
    pane.addBinding(params, 'fade', { min: 0.35, max: 0.85, step: 0.01 });
    pane.addBinding(params, 'blur', { min: 0, max: 7, step: 0.25 });
    pane.addBinding(params, 'echoScale', { min: 0.5, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'fontWeight', { min: 500, max: 950, step: 50 });
    pane.addButton({ title: 'Replay' }).on('click', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import EchoText from '~/components/ui/echo-text/EchoText.vue';
</script>

<template>
  <EchoText
    text=&quot;Motion Echo&quot;
    :echoes=&quot;12&quot;
    :lag=&quot;0.24&quot;
    :offset=&quot;36&quot;
    direction=&quot;right&quot;
    tint=&quot;#7dd3fc&quot;
    trail=&quot;pointer&quot;
    :click-burst=&quot;true&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6 text-foreground md:px-14"
    >
      <EchoText
        :key="`${params.preset}-${replayKey}`"
        :text="params.text"
        :color="textColor"
        :tint="tint"
        :echo-colors="echoColors"
        :trail="params.trail"
        :mode="params.mode"
        :click-burst="params.clickBurst"
        :echoes="params.echoes"
        :lag="params.lag"
        :offset="params.offset"
        :direction="params.direction"
        :fade="params.fade"
        :blur="params.blur"
        :echo-style="params.echoStyle"
        :echo-scale="params.echoScale"
        :duration="params.duration"
        :ease="params.ease"
        :cursor-radius="params.cursorRadius"
        :font-size="params.fontSize"
        :font-weight="params.fontWeight"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor around · click the text to burst
      </p>
      <ShaderPane title="Echo Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
