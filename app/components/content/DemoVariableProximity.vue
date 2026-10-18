<script setup lang="ts">
  import { computed, reactive, ref, shallowRef } from 'vue';
  import VariableProximity from '@registry/new-york/variable-proximity/VariableProximity.vue';
  import {
    isVariableProximityPreset,
    variableProximityPreset,
  } from '@registry/new-york/variable-proximity/variable-proximity-presets.ts';
  import type {
    VariableProximityPresetName,
    VariableProximityPresetValues,
  } from '@registry/new-york/variable-proximity/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();
  const containerRef = ref<HTMLElement | null>(null);
  const paneRef = shallowRef<Pane | null>(null);
  const initialPreset: VariableProximityPresetName = 'classic';

  const look = reactive<VariableProximityPresetValues>(
    variableProximityPreset(initialPreset),
  );
  const params = reactive<{
    preset: VariableProximityPresetName;
    fromPick: string;
    toPick: string;
  }>({ preset: initialPreset, fromPick: '#ffffff', toPick: '#ffffff' });

  const fromSettings = computed(() => `'wght' ${look.restWeight}, 'opsz' 9`);
  const toSettings = computed(() => `'wght' ${look.peakWeight}, 'opsz' 40`);
  const fontSize = computed(() => `min(${look.fontSize}px, 8.5cqi)`);

  function ink() {
    return colorMode.value === 'light' ? '#18181b' : '#ffffff';
  }

  function applyPreset(name: VariableProximityPresetName) {
    Object.assign(look, variableProximityPreset(name));
    params.preset = name;
    params.fromPick = look.fromColor || ink();
    params.toPick = look.toColor || ink();
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    params.fromPick = ink();
    params.toPick = ink();
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Inverse: 'inverse',
          Hairline: 'hairline',
          Lift: 'lift',
        },
      })
      .on('change', (ev) => {
        if (isVariableProximityPreset(ev.value)) applyPreset(ev.value);
      });
    pane
      .addBinding(params, 'fromPick', { label: 'from-color' })
      .on('change', (ev) => {
        look.fromColor = ev.value;
      });
    pane
      .addBinding(params, 'toPick', { label: 'to-color' })
      .on('change', (ev) => {
        look.toColor = ev.value;
      });
    pane.addBinding(look, 'falloff', {
      options: {
        Linear: 'linear',
        Exponential: 'exponential',
        Gaussian: 'gaussian',
      },
    });
    pane.addBinding(look, 'radius', { min: 50, max: 300, step: 10 });
    pane.addBinding(look, 'smoothing', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(look, 'scale', { min: 0.8, max: 1.6, step: 0.02 });
    pane.addBinding(look, 'lift', { min: 0, max: 0.4, step: 0.01 });
    pane.addBinding(look, 'idleWave');
    pane.addBinding(look, 'restWeight', { min: 100, max: 1000, step: 50 });
    pane.addBinding(look, 'peakWeight', { min: 100, max: 1000, step: 50 });
    pane.addBinding(look, 'fontSize', { min: 32, max: 96, step: 2 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import VariableProximity from '~/components/ui/variable-proximity/VariableProximity.vue';

  const containerRef = ref&lt;HTMLElement | null&gt;(null);
</script>

<template>
  <div ref=&quot;containerRef&quot; class=&quot;relative&quot;>
    <VariableProximity
      label=&quot;Hover me! And then star nxui on GitHub, or else...&quot;
      from-font-variation-settings=&quot;'wght' 400, 'opsz' 9&quot;
      to-font-variation-settings=&quot;'wght' 1000, 'opsz' 40&quot;
      :container-ref=&quot;containerRef&quot;
      :radius=&quot;100&quot;
      falloff=&quot;linear&quot;
      :font-size=&quot;64&quot;
    />
  </div>
</template>`"
  >
    <div
      ref="containerRef"
      class="@container relative flex size-full min-h-100 items-center justify-center overflow-hidden p-4 text-foreground"
    >
      <VariableProximity
        label="Hover me! And then star nxui on GitHub, or else..."
        :from-font-variation-settings="fromSettings"
        :to-font-variation-settings="toSettings"
        :container-ref="containerRef"
        :radius="look.radius"
        :falloff="look.falloff"
        :smoothing="look.smoothing"
        :from-color="look.fromColor || undefined"
        :to-color="look.toColor || undefined"
        :scale="look.scale"
        :lift="look.lift"
        :idle-wave="look.idleWave"
        :font-size="fontSize"
        class="block! max-w-[20ch] cursor-pointer text-center leading-[1.05]"
      />
      <ShaderPane title="Variable Proximity" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
