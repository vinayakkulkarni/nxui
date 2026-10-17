<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import TextType from '@registry/new-york/text-type/TextType.vue';
  import type { TextTypeProps } from '@registry/new-york/text-type/types';
  import type { Pane } from 'tweakpane';

  const SENTENCES = [
    'Welcome to nxui! Good to see you!',
    'Build some amazing experiences!',
  ];
  const WORDS = ['interfaces', 'products', 'experiences'];

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const LOOK: Required<
    Pick<
      TextTypeProps,
      | 'cursorColor'
      | 'prefixColor'
      | 'typingSpeed'
      | 'deletingSpeed'
      | 'pauseDuration'
      | 'mistakes'
      | 'typeEffect'
      | 'cursorBlinkDuration'
      | 'cursorGlide'
      | 'cursorStyle'
      | 'cursorCharacter'
      | 'deleteMode'
      | 'showCursor'
      | 'prefix'
    >
  > & {
    variableSpeedEnabled: boolean;
    variableSpeedMin: number;
    variableSpeedMax: number;
  } = {
    cursorColor: '',
    prefixColor: '',
    typingSpeed: 75,
    deletingSpeed: 50,
    pauseDuration: 1500,
    mistakes: 0,
    typeEffect: 'none',
    cursorBlinkDuration: 0.5,
    variableSpeedEnabled: false,
    variableSpeedMin: 60,
    variableSpeedMax: 120,
    cursorGlide: true,
    cursorStyle: 'underscore',
    cursorCharacter: '_',
    deleteMode: 'backspace',
    showCursor: true,
    prefix: '',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    human: {
      cursorStyle: 'bar',
      typeEffect: 'fade',
      mistakes: 0.55,
      deletingSpeed: 35,
      pauseDuration: 2200,
      cursorBlinkDuration: 0.55,
      variableSpeedEnabled: true,
      variableSpeedMin: 40,
      variableSpeedMax: 170,
    },
    editor: {
      cursorStyle: 'block',
      typeEffect: 'blur',
      deleteMode: 'select',
      typingSpeed: 55,
      deletingSpeed: 22,
      pauseDuration: 2000,
      cursorBlinkDuration: 0.6,
    },
    hero: {
      prefix: 'We build ',
      prefixColor: '#8a8693',
      cursorColor: '#ff5a36',
      cursorStyle: 'bar',
      typeEffect: 'rise',
      typingSpeed: 90,
      deletingSpeed: 40,
      pauseDuration: 1800,
    },
  };

  const params = reactive({ preset: 'classic', ...LOOK });
  const renderKey = ref(0);
  const finished = ref(0);
  let paneRef: Pane | null = null;

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.cursorColor === previous) {
        params.cursorColor = value;
      }
      if (!previous || params.prefixColor === previous) {
        params.prefixColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  // The ink color stands for `currentColor`, so the text follows the theme.
  const cursorColor = computed(() =>
    params.cursorColor === ink.value ? 'currentColor' : params.cursorColor,
  );
  const prefixColor = computed(() =>
    params.prefixColor === ink.value ? 'currentColor' : params.prefixColor,
  );
  const variableSpeed = computed(() =>
    params.variableSpeedEnabled
      ? { min: params.variableSpeedMin, max: params.variableSpeedMax }
      : undefined,
  );
  const text = computed(() => (params.prefix ? WORDS : SENTENCES));

  watch(
    () => params.prefix,
    () => renderKey.value++,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name]);
    if (!PRESETS[name]?.cursorColor) params.cursorColor = ink.value;
    if (!PRESETS[name]?.prefixColor) params.prefixColor = ink.value;
    renderKey.value++;
    paneRef?.refresh();
  }

  function onSentenceComplete() {
    finished.value++;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Human: 'human',
          Editor: 'editor',
          Hero: 'hero',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'cursorColor');
    pane.addBinding(params, 'prefixColor');
    pane.addBinding(params, 'typingSpeed', { min: 10, max: 200, step: 5 });
    pane.addBinding(params, 'deletingSpeed', { min: 10, max: 100, step: 5 });
    pane.addBinding(params, 'pauseDuration', {
      min: 500,
      max: 5000,
      step: 100,
    });
    pane.addBinding(params, 'mistakes', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'typeEffect', {
      options: { None: 'none', Fade: 'fade', Blur: 'blur', Rise: 'rise' },
    });
    pane.addBinding(params, 'cursorBlinkDuration', {
      label: 'cursor-blink',
      min: 0.1,
      max: 2,
      step: 0.05,
    });
    pane.addBinding(params, 'variableSpeedEnabled', {
      label: 'variable-speed',
    });
    pane.addBinding(params, 'variableSpeedMin', {
      label: 'speed-min',
      min: 10,
      max: 150,
      step: 5,
    });
    pane.addBinding(params, 'variableSpeedMax', {
      label: 'speed-max',
      min: 50,
      max: 300,
      step: 5,
    });
    pane.addBinding(params, 'cursorGlide');
    pane.addBinding(params, 'cursorStyle', {
      options: {
        Bar: 'bar',
        Block: 'block',
        Underscore: 'underscore',
        Character: 'character',
      },
    });
    pane.addBinding(params, 'cursorCharacter', {
      options: {
        'Underscore (_)': '_',
        'Pipe (|)': '|',
        'Block (▎)': '▎',
        'Dot (●)': '●',
        'Full Block (█)': '█',
      },
    });
    pane.addBinding(params, 'deleteMode', {
      options: { Backspace: 'backspace', Select: 'select' },
    });
    pane.addBinding(params, 'showCursor');
    pane.addBinding(params, 'prefix');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TextType from '~/components/ui/text-type/TextType.vue';
</script>

<template>
  <TextType
    :text=&quot;['Welcome to nxui! Good to see you!', 'Build some amazing experiences!']&quot;
    cursor-style=&quot;underscore&quot;
    :typing-speed=&quot;75&quot;
    :deleting-speed=&quot;50&quot;
    :pause-duration=&quot;1500&quot;
    class=&quot;text-6xl font-bold&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <div class="absolute inset-0 p-8 sm:p-16">
        <TextType
          :key="renderKey"
          :text="text"
          :cursor-color="cursorColor"
          :prefix-color="prefixColor"
          :typing-speed="params.typingSpeed"
          :deleting-speed="params.deletingSpeed"
          :pause-duration="params.pauseDuration"
          :mistakes="params.mistakes"
          :type-effect="params.typeEffect"
          :cursor-blink-duration="params.cursorBlinkDuration"
          :variable-speed="variableSpeed"
          :cursor-glide="params.cursorGlide"
          :cursor-style="params.cursorStyle"
          :cursor-character="params.cursorCharacter"
          :delete-mode="params.deleteMode"
          :show-cursor="params.showCursor"
          :prefix="params.prefix"
          class="text-[clamp(1.5rem,4vw,4rem)] font-bold text-foreground"
          @sentence-complete="onSentenceComplete"
        />
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
      >
        sentences cleared: {{ finished }}
      </p>
      <ShaderPane title="Text Type" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
