<script setup lang="ts">
  import { computed, reactive, shallowRef, watch } from 'vue';
  import SloshGauge from '@registry/new-york/slosh-gauge/SloshGauge.vue';
  import type { SloshGaugePreset } from '@registry/new-york/slosh-gauge/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_LIQUID = '#f5f5f5';
  const DEFAULT_GLASS = '#27272a';
  const PRESETS: SloshGaugePreset[] = [
    { label: 'Empty', value: 0 },
    { label: '25%', value: 25 },
    { label: '60%', value: 60 },
    { label: 'Full', value: 100 },
  ];

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const params = reactive({
    value: 60,
    interactive: true,
    showValue: true,
    disabled: false,
    liquidColor: DEFAULT_LIQUID,
    glassColor: DEFAULT_GLASS,
    width: 88,
    height: 180,
    radius: 20,
    ticks: 4,
    viscosity: 0.15,
    tilt: 0.45,
    splash: 0.42,
  });

  const liquid = computed(() =>
    !isDark.value && params.liquidColor === DEFAULT_LIQUID
      ? '#18181b'
      : params.liquidColor,
  );
  const glass = computed(() =>
    !isDark.value && params.glassColor === DEFAULT_GLASS
      ? '#f6f6f6'
      : params.glassColor,
  );

  const paneRef = shallowRef<Pane | null>(null);
  watch(
    () => params.value,
    () => paneRef.value?.refresh(),
  );

  function setPreset(value: number) {
    params.value = value;
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane.addBinding(params, 'value', { min: 0, max: 100, step: 1 });
    pane.addBinding(params, 'interactive');
    pane.addBinding(params, 'showValue');
    pane.addBinding(params, 'disabled');
    pane.addBinding(params, 'liquidColor');
    pane.addBinding(params, 'glassColor');
    pane.addBinding(params, 'width', { min: 56, max: 160, step: 4 });
    pane.addBinding(params, 'height', { min: 120, max: 300, step: 4 });
    pane.addBinding(params, 'radius', { min: 0, max: 44, step: 1 });
    pane.addBinding(params, 'ticks', { min: 0, max: 10, step: 1 });
    pane.addBinding(params, 'viscosity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tilt', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'splash', { min: 0, max: 0.8, step: 0.02 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import SloshGauge from '~/components/ui/slosh-gauge/SloshGauge.vue';

  const level = ref(60);
</script>

<template>
  <SloshGauge
    v-model=&quot;level&quot;
    interactive
    liquid-color=&quot;#f5f5f5&quot;
    glass-color=&quot;#27272a&quot;
    :viscosity=&quot;0.15&quot;
    :tilt=&quot;0.45&quot;
    :splash=&quot;0.42&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6 text-foreground"
    >
      <SloshGauge
        v-model="params.value"
        :interactive="params.interactive"
        :show-value="params.showValue"
        :disabled="params.disabled"
        :liquid-color="liquid"
        :glass-color="glass"
        :width="params.width"
        :height="params.height"
        :radius="params.radius"
        :ticks="params.ticks"
        :viscosity="params.viscosity"
        :tilt="params.tilt"
        :splash="params.splash"
        class="mb-8"
      />
      <div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5">
        <button
          v-for="preset in PRESETS"
          :key="preset.label"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          @click="setPreset(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>
      <ShaderPane title="Slosh Gauge" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
