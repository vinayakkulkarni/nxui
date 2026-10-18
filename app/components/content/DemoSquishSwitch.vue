<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SquishSwitch from '@registry/new-york/squish-switch/SquishSwitch.vue';
  import type { SquishSwitchProps } from '@registry/new-york/squish-switch/types';
  import type { Pane } from 'tweakpane';

  const DARK = {
    trackColor: '#27272a',
    trackOnColor: '#f5f5f5',
    thumbColor: '#4e4e51',
    thumbOnColor: '#27272a',
  };
  const LIGHT = {
    trackColor: '#d4d4d8',
    trackOnColor: '#18181b',
    thumbColor: '#b0b0b3',
    thumbOnColor: '#d4d4d8',
  };

  const checked = ref(false);
  const params = reactive<
    Required<
      Pick<
        SquishSwitchProps,
        | 'disabled'
        | 'trackColor'
        | 'trackOnColor'
        | 'thumbColor'
        | 'thumbOnColor'
        | 'width'
        | 'height'
        | 'radius'
        | 'speed'
        | 'stretch'
        | 'hoverScale'
        | 'colorDuration'
      >
    >
  >({
    disabled: false,
    ...DARK,
    width: 76,
    height: 38,
    radius: 19,
    speed: 50,
    stretch: 36,
    hoverScale: 1.035,
    colorDuration: 320,
  });
  const toggle = reactive({ checked: false });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');
  const track = computed(() =>
    isLight.value && params.trackColor === DARK.trackColor
      ? LIGHT.trackColor
      : params.trackColor,
  );
  const trackOn = computed(() =>
    isLight.value && params.trackOnColor === DARK.trackOnColor
      ? LIGHT.trackOnColor
      : params.trackOnColor,
  );
  const thumb = computed(() =>
    isLight.value && params.thumbColor === DARK.thumbColor
      ? LIGHT.thumbColor
      : params.thumbColor,
  );
  const thumbOn = computed(() =>
    isLight.value && params.thumbOnColor === DARK.thumbOnColor
      ? LIGHT.thumbOnColor
      : params.thumbOnColor,
  );

  let paneRef: Pane | null = null;
  function onToggle(value: boolean) {
    checked.value = value;
    toggle.checked = value;
    paneRef?.refresh();
  }
  function onPaneToggle() {
    checked.value = toggle.checked;
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane.addBinding(toggle, 'checked').on('change', onPaneToggle);
    pane.addBinding(params, 'disabled');
    pane.addBinding(params, 'trackColor');
    pane.addBinding(params, 'trackOnColor');
    pane.addBinding(params, 'thumbColor');
    pane.addBinding(params, 'thumbOnColor');
    pane.addBinding(params, 'width', { min: 44, max: 120, step: 2 });
    pane.addBinding(params, 'height', { min: 24, max: 64, step: 2 });
    pane.addBinding(params, 'radius', { min: 0, max: 32, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 100, step: 5 });
    pane.addBinding(params, 'stretch', { min: 0, max: 100, step: 2 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.1, step: 0.005 });
    pane.addBinding(params, 'colorDuration', { min: 0, max: 800, step: 20 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import SquishSwitch from '~/components/ui/squish-switch/SquishSwitch.vue';

  const airplane = ref(false);
</script>

<template>
  <SquishSwitch
    v-model=&quot;airplane&quot;
    label=&quot;Airplane mode&quot;
    track-color=&quot;#27272a&quot;
    track-on-color=&quot;#f5f5f5&quot;
    thumb-color=&quot;#4e4e51&quot;
    thumb-on-color=&quot;#27272a&quot;
    :speed=&quot;50&quot;
    :stretch=&quot;36&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 text-sm text-foreground"
    >
      <SquishSwitch
        :model-value="checked"
        label="Airplane mode"
        :disabled="params.disabled"
        :track-color="track"
        :track-on-color="trackOn"
        :thumb-color="thumb"
        :thumb-on-color="thumbOn"
        :width="params.width"
        :height="params.height"
        :radius="params.radius"
        :speed="params.speed"
        :stretch="params.stretch"
        :hover-scale="params.hoverScale"
        :color-duration="params.colorDuration"
        @update:model-value="onToggle"
      />
      <ShaderPane title="Squish Switch" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
