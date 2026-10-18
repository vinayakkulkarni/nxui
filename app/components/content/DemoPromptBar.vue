<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from 'vue';
  import PromptBar from '@registry/new-york/prompt-bar/PromptBar.vue';
  import type { PromptBarModel } from '@registry/new-york/prompt-bar/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_BG = '#27272a';
  const DEFAULT_INK = '#f5f5f5';
  const DEFAULT_MENU = '#323236';
  const FILES = ['brief.pdf', 'screenshot.png', 'metrics.csv'];
  const TRANSCRIPT = 'Compare the last two quarters of sales';
  const RESPONSE_MS = 2400;
  const DICTATION_MS = 2200;
  const NO_MODELS: PromptBarModel[] = [];
  const NO_EFFORTS: string[] = [];

  const params = reactive({
    placeholder: 'Ask anything',
    background: DEFAULT_BG,
    color: DEFAULT_INK,
    menuBackground: DEFAULT_MENU,
    sparkColor: '#b39dff',
    sparkBoost: 1,
    width: 400,
    radius: 16,
    maxRows: 5,
    morphDuration: 240,
    squash: 0.12,
    tilt: 8,
    pressScale: 0.96,
    busy: false,
    models: true,
    efforts: true,
    dictation: true,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const background = computed(() =>
    isLight.value && params.background === DEFAULT_BG
      ? '#f6f6f6'
      : params.background,
  );
  const ink = computed(() =>
    isLight.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );
  const menu = computed(() =>
    isLight.value && params.menuBackground === DEFAULT_MENU
      ? '#ffffff'
      : params.menuBackground,
  );

  const flowBusy = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fileIndex = 0;

  function onSend() {
    flowBusy.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      flowBusy.value = false;
    }, RESPONSE_MS);
  }
  function onStop() {
    clearTimeout(timer);
    flowBusy.value = false;
    params.busy = false;
  }
  function attach() {
    const file = FILES[fileIndex % FILES.length];
    fileIndex += 1;
    return file;
  }
  function dictate() {
    return new Promise<string>((resolve) => {
      setTimeout(() => resolve(TRANSCRIPT), DICTATION_MS);
    });
  }
  onBeforeUnmount(() => clearTimeout(timer));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'placeholder');
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'color', { label: 'ink' });
    pane.addBinding(params, 'menuBackground', { label: 'menu' });
    pane.addBinding(params, 'sparkColor', { label: 'spark' });
    pane.addBinding(params, 'sparkBoost', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'width', { min: 300, max: 520, step: 4 });
    pane.addBinding(params, 'radius', { min: 0, max: 28, step: 1 });
    pane.addBinding(params, 'maxRows', { min: 1, max: 10, step: 1 });
    pane.addBinding(params, 'morphDuration', {
      label: 'morph',
      min: 120,
      max: 400,
      step: 20,
    });
    pane.addBinding(params, 'squash', { min: 0, max: 0.3, step: 0.01 });
    pane.addBinding(params, 'tilt', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'pressScale', { min: 0.85, max: 1, step: 0.01 });
    pane.addBinding(params, 'busy');
    pane.addBinding(params, 'models', { label: 'model-picker' });
    pane.addBinding(params, 'efforts', { label: 'effort-picker' });
    pane.addBinding(params, 'dictation');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import PromptBar from '~/components/ui/prompt-bar/PromptBar.vue';
  import type { PromptBarSendDetail } from '~/components/ui/prompt-bar/types';

  const busy = ref(false);

  function onSend(text: string, detail: PromptBarSendDetail) {
    busy.value = true;
    console.log(text, detail.model?.name, detail.effort, detail.attachments);
    setTimeout(() => (busy.value = false), 2400);
  }

  function attach() {
    return ['brief.pdf'];
  }

  function dictate() {
    return new Promise<string>((resolve) => {
      setTimeout(() => resolve('Compare the last two quarters of sales'), 2200);
    });
  }
</script>

<template>
  <PromptBar
    placeholder=&quot;Ask anything&quot;
    :busy=&quot;busy&quot;
    :on-attach=&quot;attach&quot;
    :on-dictate=&quot;dictate&quot;
    background=&quot;#27272a&quot;
    color=&quot;#f5f5f5&quot;
    menu-background=&quot;#323236&quot;
    spark-color=&quot;#b39dff&quot;
    @send=&quot;onSend&quot;
    @stop=&quot;busy = false&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 pt-72"
    >
      <PromptBar
        :placeholder="params.placeholder"
        :models="params.models ? undefined : NO_MODELS"
        :efforts="params.efforts ? undefined : NO_EFFORTS"
        :busy="params.busy || flowBusy"
        :on-attach="attach"
        :on-dictate="params.dictation ? dictate : undefined"
        :background="background"
        :color="ink"
        :menu-background="menu"
        :spark-color="params.sparkColor"
        :spark-boost="params.sparkBoost"
        :width="params.width"
        :radius="params.radius"
        :max-rows="params.maxRows"
        :morph-duration="params.morphDuration"
        :squash="params.squash"
        :tilt="params.tilt"
        :press-scale="params.pressScale"
        @send="onSend"
        @stop="onStop"
      />
      <ShaderPane title="Prompt Bar" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
