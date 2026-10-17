<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import DodgeField from '@registry/new-york/dodge-field/DodgeField.vue';
  import type { DodgeFieldProps } from '@registry/new-york/dodge-field/types';
  import type { Pane } from 'tweakpane';

  const params = reactive<
    Required<Omit<DodgeFieldProps, 'class' | 'taunts' | 'notice'>>
  >({
    inkColor: '#f5f5f5',
    contrastColor: '#18181b',
    fieldHeight: 240,
    reach: 72,
    radius: 120,
    falloff: 2,
    fleeDuration: 130,
    returnDuration: 620,
    returnBounce: 0.1,
    patience: 4,
    axis: 'both',
    wall: 'clamp',
    disabled: false,
  });
  const colors = reactive({ custom: false });
  const ink = computed(() => (colors.custom ? params.inkColor : undefined));
  const contrast = computed(() =>
    colors.custom ? params.contrastColor : undefined,
  );

  const status = ref('Hover the pill and try to click it.');

  function onDodge(count: number) {
    status.value = `Dodged ${count} ${count === 1 ? 'time' : 'times'}.`;
  }

  function onRelent() {
    status.value = 'It gave in. Click it now.';
  }

  function onCatch() {
    status.value = 'Caught.';
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(colors, 'custom', { label: 'customColors' });
    pane.addBinding(params, 'inkColor');
    pane.addBinding(params, 'contrastColor');
    pane.addBinding(params, 'fieldHeight', { min: 120, max: 360, step: 10 });
    pane.addBinding(params, 'reach', { min: 14, max: 120, step: 2 });
    pane.addBinding(params, 'radius', { min: 60, max: 200, step: 5 });
    pane.addBinding(params, 'falloff', { min: 1, max: 4, step: 0.5 });
    pane.addBinding(params, 'fleeDuration', { min: 60, max: 300, step: 10 });
    pane.addBinding(params, 'returnDuration', {
      min: 200,
      max: 1000,
      step: 20,
    });
    pane.addBinding(params, 'returnBounce', { min: 0, max: 0.3, step: 0.05 });
    pane.addBinding(params, 'patience', { min: 1, max: 8, step: 1 });
    pane.addBinding(params, 'axis', {
      options: { Both: 'both', Horizontal: 'x', Vertical: 'y' },
    });
    pane.addBinding(params, 'wall', {
      options: { Clamp: 'clamp', Bounce: 'bounce' },
    });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DodgeField from '~/components/ui/dodge-field/DodgeField.vue';
</script>

<template>
  <DodgeField
    :field-height=&quot;240&quot;
    :reach=&quot;72&quot;
    :radius=&quot;120&quot;
    :patience=&quot;4&quot;
    axis=&quot;both&quot;
    wall=&quot;clamp&quot;
    notice=&quot;Nothing dodges on touch. Tap away.&quot;
    @dodge=&quot;(count) => console.log('dodged', count)&quot;
    @catch=&quot;() => console.log('caught')&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <DodgeField
        class="max-w-xl"
        :ink-color="ink"
        :contrast-color="contrast"
        :field-height="params.fieldHeight"
        :reach="params.reach"
        :radius="params.radius"
        :falloff="params.falloff"
        :flee-duration="params.fleeDuration"
        :return-duration="params.returnDuration"
        :return-bounce="params.returnBounce"
        :patience="params.patience"
        :axis="params.axis"
        :wall="params.wall"
        :disabled="params.disabled"
        notice="Nothing dodges on touch. Tap away."
        @dodge="onDodge"
        @relent="onRelent"
        @catch="onCatch"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground"
        aria-live="polite"
      >
        {{ status }}
      </p>
      <ShaderPane title="Dodge Field" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
