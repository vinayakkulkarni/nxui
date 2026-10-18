<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import type { Pane } from 'tweakpane';
  import BorderGlow from '@registry/new-york/border-glow/BorderGlow.vue';

  const DEFAULT_BACKGROUND = '#120F17';
  const DEFAULT_GLOW = '40 80 80';
  const DEFAULT_INTENSITY = 1;

  const params = reactive({
    edgeSensitivity: 30,
    glowColor: DEFAULT_GLOW,
    backgroundColor: DEFAULT_BACKGROUND,
    borderRadius: 28,
    glowRadius: 40,
    glowIntensity: DEFAULT_INTENSITY,
    coneSpread: 25,
    animated: false,
    color1: '#c084fc',
    color2: '#f472b6',
    color3: '#38bdf8',
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value === 'light');

  const backgroundColor = computed(() =>
    isLight.value && params.backgroundColor === DEFAULT_BACKGROUND
      ? '#ffffff'
      : params.backgroundColor,
  );
  const glowColor = computed(() =>
    isLight.value && params.glowColor === DEFAULT_GLOW
      ? '278 90 58'
      : params.glowColor,
  );
  const glowIntensity = computed(() =>
    isLight.value && params.glowIntensity === DEFAULT_INTENSITY
      ? 1.25
      : params.glowIntensity,
  );
  const fillOpacity = computed(() => (isLight.value ? 0.22 : 0.5));
  const colors = computed(() => [params.color1, params.color2, params.color3]);

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'edgeSensitivity', {
      label: 'edge sensitivity',
      min: 0,
      max: 80,
      step: 1,
    });
    pane.addBinding(params, 'borderRadius', {
      label: 'border radius',
      min: 0,
      max: 50,
      step: 1,
    });
    pane.addBinding(params, 'glowRadius', {
      label: 'glow radius',
      min: 10,
      max: 80,
      step: 1,
    });
    pane.addBinding(params, 'glowIntensity', {
      label: 'glow intensity',
      min: 0.1,
      max: 3,
      step: 0.1,
    });
    pane.addBinding(params, 'coneSpread', {
      label: 'cone spread',
      min: 5,
      max: 45,
      step: 1,
    });
    pane.addBinding(params, 'animated', { label: 'animated intro' });
    pane.addBinding(params, 'glowColor', { label: 'glow (H S L)' });
    pane.addBinding(params, 'backgroundColor', { label: 'background' });
    pane.addBinding(params, 'color1', { label: 'color 1' });
    pane.addBinding(params, 'color2', { label: 'color 2' });
    pane.addBinding(params, 'color3', { label: 'color 3' });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import BorderGlow from '~/components/ui/border-glow/BorderGlow.vue';
</script>

<template>
  <BorderGlow
    :edge-sensitivity=&quot;30&quot;
    glow-color=&quot;40 80 80&quot;
    background-color=&quot;#120F17&quot;
    :border-radius=&quot;28&quot;
    :glow-radius=&quot;40&quot;
    :glow-intensity=&quot;1&quot;
    :cone-spread=&quot;25&quot;
    :colors=&quot;['#c084fc', '#f472b6', '#38bdf8']&quot;
  >
    <div class=&quot;flex min-h-50 flex-col items-start justify-center p-8&quot;>
      <h3 class=&quot;text-xl font-semibold&quot;>Hover Near the Edges</h3>
      <p class=&quot;mt-1 text-sm opacity-70&quot;>
        Move your cursor close to the card border.
      </p>
    </div>
  </BorderGlow>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <BorderGlow
        class="w-full max-w-md"
        :edge-sensitivity="params.edgeSensitivity"
        :glow-color="glowColor"
        :background-color="backgroundColor"
        :border-radius="params.borderRadius"
        :glow-radius="params.glowRadius"
        :glow-intensity="glowIntensity"
        :cone-spread="params.coneSpread"
        :animated="params.animated"
        :colors="colors"
        :fill-opacity="fillOpacity"
      >
        <div
          class="flex min-h-50 flex-col items-start justify-center p-8 text-foreground"
        >
          <Icon name="lucide:sparkles" class="mb-3 size-10 text-[2.5rem]" />
          <p class="text-[1.4rem] font-semibold tracking-tight">
            Hover Near the Edges
          </p>
          <p class="mt-1 max-w-[40ch] text-sm text-muted-foreground">
            Move your cursor close to the card border to see the colored glow
            effect follow your pointer direction.
          </p>
        </div>
      </BorderGlow>
      <ShaderPane title="Border Glow" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
