<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import FlyingButton from '@registry/new-york/flying-button/FlyingButton.vue';
  import type { Pane } from 'tweakpane';
  import type {
    FlyingButtonSize,
    FlyingButtonTheme,
    FlyingButtonTrigger,
  } from '@registry/new-york/flying-button/types';

  const DARK = {
    thrustColor: '#8ec5ff',
    smokeColor: '#eef1f6',
    buttonColor: '#27272a',
    textColor: '#f5f5f5',
    rampColor: '#25222b',
  };

  const LIGHT = {
    thrustColor: '#4f8cff',
    smokeColor: '#e9ebf0',
    buttonColor: '#18181b',
    textColor: '#fafafa',
    rampColor: '#ececf0',
  };

  const MAX_RADIUS = 22;
  function widen<T>(value: T): T {
    return value;
  }
  const size = widen<FlyingButtonSize>('medium');
  const trigger = widen<FlyingButtonTrigger>('hover');

  const params = reactive({
    label: 'Take off',
    ...DARK,
    size,
    jets: 2,
    trigger,
    radius: MAX_RADIUS,
    altitude: 170,
    hoverTime: 2.4,
    smoke: 1,
    turbulence: 1,
    wobble: 1,
    ramp: false,
    thrusters: true,
    carryCursor: true,
  });

  const colorMode = useColorMode();
  const theme = computed<FlyingButtonTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const isLight = computed(() => theme.value === 'light');

  const thrustColor = computed(() =>
    isLight.value && params.thrustColor === DARK.thrustColor
      ? LIGHT.thrustColor
      : params.thrustColor,
  );
  const smokeColor = computed(() =>
    isLight.value && params.smokeColor === DARK.smokeColor
      ? LIGHT.smokeColor
      : params.smokeColor,
  );
  const buttonColor = computed(() =>
    isLight.value && params.buttonColor === DARK.buttonColor
      ? LIGHT.buttonColor
      : params.buttonColor,
  );
  const textColor = computed(() =>
    isLight.value && params.textColor === DARK.textColor
      ? LIGHT.textColor
      : params.textColor,
  );
  const rampColor = computed(() =>
    isLight.value && params.rampColor === DARK.rampColor
      ? LIGHT.rampColor
      : params.rampColor,
  );
  const radius = computed(() =>
    params.radius >= MAX_RADIUS ? undefined : params.radius,
  );
  const label = computed(() => params.label || 'Take off');

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'label');
    pane.addBinding(params, 'thrustColor', { label: 'thrust' });
    pane.addBinding(params, 'smokeColor', { label: 'smoke color' });
    pane.addBinding(params, 'buttonColor', { label: 'button' });
    pane.addBinding(params, 'textColor', { label: 'text' });
    pane.addBinding(params, 'rampColor', { label: 'ramp color' });
    pane.addBinding(params, 'size', {
      options: {
        Small: 'small',
        Medium: 'medium',
        Large: 'large',
        'Extra Large': 'extra-large',
      },
    });
    pane.addBinding(params, 'jets', { options: { 1: 1, 2: 2, 3: 3, 4: 4 } });
    pane.addBinding(params, 'trigger', {
      options: { Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'radius', { min: 0, max: MAX_RADIUS, step: 1 });
    pane.addBinding(params, 'altitude', { min: 60, max: 260, step: 10 });
    pane.addBinding(params, 'hoverTime', {
      label: 'hover time',
      min: 0.5,
      max: 6,
      step: 0.1,
    });
    pane.addBinding(params, 'smoke', { min: 0.2, max: 2, step: 0.1 });
    pane.addBinding(params, 'turbulence', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'wobble', { min: 0, max: 3, step: 0.1 });
    pane.addBinding(params, 'ramp');
    pane.addBinding(params, 'thrusters');
    pane.addBinding(params, 'carryCursor', { label: 'carry cursor' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import FlyingButton from '~/components/ui/flying-button/FlyingButton.vue';
</script>

<template>
  <div class=&quot;relative h-110 w-full overflow-hidden&quot;>
    <FlyingButton
      theme=&quot;dark&quot;
      size=&quot;medium&quot;
      trigger=&quot;hover&quot;
      thrust-color=&quot;#8ec5ff&quot;
      smoke-color=&quot;#eef1f6&quot;
      button-color=&quot;#27272a&quot;
      text-color=&quot;#f5f5f5&quot;
      :altitude=&quot;170&quot;
      :hover-time=&quot;2.4&quot;
      :jets=&quot;2&quot;
      :thrusters=&quot;true&quot;
      :carry-cursor=&quot;true&quot;
      :smoke=&quot;1&quot;
      :turbulence=&quot;1&quot;
      :wobble=&quot;1&quot;
    >
      Take off
    </FlyingButton>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <FlyingButton
        class="absolute inset-0 size-full"
        :theme="theme"
        :thrust-color="thrustColor"
        :smoke-color="smokeColor"
        :button-color="buttonColor"
        :text-color="textColor"
        :ramp-color="rampColor"
        :size="params.size"
        :radius="radius"
        :ramp="params.ramp"
        :altitude="params.altitude"
        :hover-time="params.hoverTime"
        :jets="params.jets"
        :thrusters="params.thrusters"
        :trigger="params.trigger"
        :carry-cursor="params.carryCursor"
        :smoke="params.smoke"
        :turbulence="params.turbulence"
        :wobble="params.wobble"
      >
        {{ label }}
      </FlyingButton>
      <p
        class="pointer-events-none absolute inset-x-0 top-4 z-10 text-center text-sm text-muted-foreground"
      >
        {{
          params.ramp
            ? 'click to ride the loop'
            : params.trigger === 'click'
              ? 'click to take off, drag it while it flies'
              : 'hover to take off, drag it while it flies'
        }}
      </p>
      <ShaderPane title="Flying Button" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
