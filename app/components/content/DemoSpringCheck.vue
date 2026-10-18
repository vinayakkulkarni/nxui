<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import SpringCheck from '@registry/new-york/spring-check/SpringCheck.vue';
  import type { Pane } from 'tweakpane';
  import type { SpringCheckStrike } from '@registry/new-york/spring-check/types';

  const DEFAULT_INK = '#ffffff';
  const DEFAULT_FILL = '#ffffff';
  const DEFAULT_CHECK = '#0b0b0f';
  const DEFAULT_STRIKE: SpringCheckStrike = 'left';

  const ROWS = [
    { label: 'Ship the build', defaultChecked: false },
    { label: 'Update the changelog', defaultChecked: false },
    { label: 'Book the launch call', defaultChecked: true },
  ];

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value !== 'dark');

  const params = reactive({
    color: DEFAULT_INK,
    fillColor: DEFAULT_FILL,
    checkColor: DEFAULT_CHECK,
    boxSize: 28,
    boxRadius: 9,
    fontSize: 18,
    bounce: 0.2,
    strikeLag: 0.12,
    doneOpacity: 0.42,
    strike: DEFAULT_STRIKE,
    disabled: false,
  });

  const epoch = ref(0);

  const ink = computed(() =>
    isLight.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );
  const fill = computed(() =>
    isLight.value && params.fillColor === DEFAULT_FILL
      ? '#18181b'
      : params.fillColor,
  );
  const check = computed(() =>
    isLight.value && params.checkColor === DEFAULT_CHECK
      ? '#ffffff'
      : params.checkColor,
  );

  function onReset() {
    epoch.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'fillColor');
    pane.addBinding(params, 'checkColor');
    pane.addBinding(params, 'boxSize', { min: 16, max: 40, step: 1 });
    pane.addBinding(params, 'boxRadius', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'fontSize', { min: 12, max: 28, step: 1 });
    pane.addBinding(params, 'bounce', { min: 0, max: 0.5, step: 0.05 });
    pane.addBinding(params, 'strikeLag', { min: 0, max: 0.5, step: 0.02 });
    pane.addBinding(params, 'doneOpacity', { min: 0.2, max: 0.8, step: 0.02 });
    pane.addBinding(params, 'strike', {
      options: { left: 'left', center: 'center', right: 'right', none: 'none' },
    });
    pane.addBinding(params, 'disabled');
    pane.addButton({ title: 'Reset rows' }).on('click', onReset);
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import SpringCheck from '~/components/ui/spring-check/SpringCheck.vue';

  const shipped = ref(false);
</script>

<template>
  <div class=&quot;flex flex-col items-start gap-1&quot;>
    <SpringCheck v-model=&quot;shipped&quot; label=&quot;Ship the build&quot; />
    <SpringCheck label=&quot;Update the changelog&quot; />
    <SpringCheck label=&quot;Book the launch call&quot; default-checked />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div :key="epoch" class="flex min-w-65 flex-col items-start gap-1">
        <SpringCheck
          v-for="row in ROWS"
          :key="row.label"
          :label="row.label"
          :default-checked="row.defaultChecked"
          :disabled="params.disabled"
          :color="ink"
          :fill-color="fill"
          :check-color="check"
          :box-size="params.boxSize"
          :box-radius="params.boxRadius"
          :font-size="params.fontSize"
          :bounce="params.bounce"
          :strike-lag="params.strikeLag"
          :done-opacity="params.doneOpacity"
          :strike="params.strike"
        />
      </div>
      <ShaderPane title="Spring Check" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
