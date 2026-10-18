<script setup lang="ts">
  import { computed, reactive, shallowRef } from 'vue';
  import CountUp from '@registry/new-york/count-up/CountUp.vue';
  import {
    countUpPreset,
    isCountUpPreset,
    toNumber,
  } from '@registry/new-york/count-up/count-up-presets.ts';
  import type {
    CountUpPresetName,
    CountUpTrigger,
  } from '@registry/new-york/count-up/types';
  import type { Pane } from 'tweakpane';

  const paneRef = shallowRef<Pane | null>(null);
  const initialPreset: CountUpPresetName = 'classic';
  const initialTrigger: CountUpTrigger = 'view';

  const params = reactive({
    preset: initialPreset,
    ...countUpPreset(initialPreset),
    trigger: initialTrigger,
    delay: 0,
  });

  const from = computed(() => toNumber(params.from, 0));
  const to = computed(() => toNumber(params.to, 0));
  const decimals = computed(() =>
    params.decimals === 'auto' ? undefined : Number(params.decimals),
  );
  const numberStyle = computed(() => ({
    fontSize: `min(${params.size}rem, ${Math.round(params.size * 3.4)}cqi)`,
    fontWeight: params.weight,
  }));
  // Every setting except size/weight restarts the count, like upstream's demo.
  const replayKey = computed(() =>
    [
      params.mode,
      params.easing,
      params.trigger,
      params.direction,
      params.duration,
      params.delay,
      params.replayOnHover,
      params.from,
      params.to,
      params.format,
      params.decimals,
      params.separator,
      params.prefix,
      params.suffix,
    ].join('|'),
  );

  function applyPreset(name: CountUpPresetName) {
    Object.assign(params, countUpPreset(name), { preset: name });
    paneRef.value?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef.value = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Odometer: 'odometer',
          Revenue: 'revenue',
          Compact: 'compact',
        },
      })
      .on('change', (ev) => {
        if (isCountUpPreset(ev.value)) applyPreset(ev.value);
      });
    pane.addBinding(params, 'mode', {
      options: { Count: 'count', Roll: 'roll' },
    });
    pane.addBinding(params, 'easing', {
      options: {
        'Ease out': 'easeOut',
        Linear: 'linear',
        Expo: 'expo',
        Spring: 'spring',
      },
    });
    pane.addBinding(params, 'trigger', {
      options: { 'In view': 'view', Load: 'load' },
    });
    pane.addBinding(params, 'direction', {
      options: { Up: 'up', Down: 'down' },
    });
    pane.addBinding(params, 'duration', { min: 0.5, max: 10, step: 0.1 });
    pane.addBinding(params, 'delay', { min: 0, max: 5, step: 0.5 });
    pane.addBinding(params, 'replayOnHover');
    pane.addBinding(params, 'to');
    pane.addBinding(params, 'from');
    pane.addBinding(params, 'format', {
      options: { Standard: 'standard', Compact: 'compact' },
    });
    pane.addBinding(params, 'decimals', {
      options: { Auto: 'auto', '0': '0', '1': '1', '2': '2', '3': '3' },
    });
    pane.addBinding(params, 'separator');
    pane.addBinding(params, 'prefix');
    pane.addBinding(params, 'suffix');
    pane.addBinding(params, 'size', {
      label: 'font-size (rem)',
      min: 2,
      max: 8,
      step: 0.5,
    });
    pane.addBinding(params, 'weight', {
      label: 'font-weight',
      min: 300,
      max: 900,
      step: 100,
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import CountUp from '~/components/ui/count-up/CountUp.vue';
</script>

<template>
  <CountUp
    :from=&quot;0&quot;
    :to=&quot;86420&quot;
    mode=&quot;roll&quot;
    easing=&quot;spring&quot;
    separator=&quot;,&quot;
    :duration=&quot;2.4&quot;
    replay-on-hover
    class=&quot;text-8xl font-semibold&quot;
  />
</template>`"
  >
    <div
      class="@container relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <CountUp
        :key="replayKey"
        class="text-foreground"
        :style="numberStyle"
        :from="from"
        :to="to"
        :mode="params.mode"
        :easing="params.easing"
        :trigger="params.trigger"
        :direction="params.direction"
        :duration="params.duration"
        :delay="params.delay"
        :replay-on-hover="params.replayOnHover"
        :format="params.format"
        :decimals="decimals"
        :separator="params.separator"
        :prefix="params.prefix"
        :suffix="params.suffix"
      />
      <ShaderPane title="Count Up" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
