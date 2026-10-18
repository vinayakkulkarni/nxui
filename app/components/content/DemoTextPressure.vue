<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import TextPressure from '@registry/new-york/text-pressure/TextPressure.vue';
  import type { TextPressureProps } from '@registry/new-york/text-pressure/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const ACCENT = '#ff5a1f';

  const LOOK: Required<
    Pick<
      TextPressureProps,
      | 'flex'
      | 'width'
      | 'weight'
      | 'italic'
      | 'alpha'
      | 'stroke'
      | 'scale'
      | 'radius'
      | 'smoothing'
      | 'idle'
      | 'idleSpeed'
      | 'clickRipple'
      | 'strokeWidth'
      | 'pressureColor'
      | 'strokeColor'
    >
  > = {
    flex: true,
    width: true,
    weight: true,
    italic: true,
    alpha: false,
    stroke: false,
    scale: false,
    radius: 0.5,
    smoothing: 0.5,
    idle: 'wave',
    idleSpeed: 1,
    clickRipple: true,
    strokeWidth: 3,
    pressureColor: '',
    strokeColor: ACCENT,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    heat: {
      flex: false,
      italic: false,
      idle: 'pulse',
      pressureColor: ACCENT,
      radius: 0.4,
      smoothing: 0.3,
    },
    tall: {
      scale: true,
      italic: false,
      idleSpeed: 1.4,
      radius: 0.3,
      smoothing: 0.65,
    },
    ghost: {
      alpha: true,
      width: false,
      radius: 0.4,
      smoothing: 0.85,
      idleSpeed: 0.7,
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'classic',
    text: 'Hello!',
    ...LOOK,
    textColor: '#ffffff',
    pressureColor: '#ffffff',
  });

  let paneRef: Pane | null = null;

  const textColor = computed(() =>
    params.textColor && params.textColor !== ink.value
      ? params.textColor
      : 'currentColor',
  );
  const pressureColor = computed(() =>
    params.pressureColor && params.pressureColor !== ink.value
      ? params.pressureColor
      : '',
  );

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.textColor === previous) params.textColor = value;
      if (!previous || params.pressureColor === previous) {
        params.pressureColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, { pressureColor: ink.value }, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Heat: 'heat',
          Tall: 'tall',
          Ghost: 'ghost',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'textColor', { label: 'text color' });
    pane.addBinding(params, 'pressureColor', { label: 'pressure color' });
    pane.addBinding(params, 'strokeColor', { label: 'stroke color' });
    pane.addBinding(params, 'idle', {
      options: { None: 'none', Wave: 'wave', Pulse: 'pulse' },
    });
    pane.addBinding(params, 'idleSpeed', {
      label: 'idle speed',
      min: 0.2,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'radius', { min: 0.1, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'smoothing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'clickRipple', { label: 'click ripple' });
    pane.addBinding(params, 'strokeWidth', {
      label: 'stroke width',
      min: 1,
      max: 10,
      step: 1,
    });
    pane.addBinding(params, 'flex');
    pane.addBinding(params, 'width');
    pane.addBinding(params, 'weight');
    pane.addBinding(params, 'italic');
    pane.addBinding(params, 'alpha');
    pane.addBinding(params, 'stroke');
    pane.addBinding(params, 'scale');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import TextPressure from '~/components/ui/text-pressure/TextPressure.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full&quot;>
    <TextPressure
      text=&quot;Hello!&quot;
      idle=&quot;wave&quot;
      :radius=&quot;0.5&quot;
      :smoothing=&quot;0.5&quot;
      :click-ripple=&quot;true&quot;
      :flex=&quot;true&quot;
      :width=&quot;true&quot;
      :weight=&quot;true&quot;
      :italic=&quot;true&quot;
      :min-font-size=&quot;36&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden text-foreground">
      <TextPressure
        class="absolute inset-0 size-full"
        :text="params.text"
        :text-color="textColor"
        :pressure-color="pressureColor"
        :stroke-color="params.strokeColor"
        :idle="params.idle"
        :idle-speed="params.idleSpeed"
        :radius="params.radius"
        :smoothing="params.smoothing"
        :click-ripple="params.clickRipple"
        :stroke-width="params.strokeWidth"
        :flex="params.flex"
        :width="params.width"
        :weight="params.weight"
        :italic="params.italic"
        :alpha="params.alpha"
        :stroke="params.stroke"
        :scale="params.scale"
        :min-font-size="36"
      />
      <ShaderPane title="Text Pressure" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
