<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import FlipCard from '@registry/new-york/flip-card/FlipCard.vue';
  import type { FlipCardAxis } from '@registry/new-york/flip-card/types';
  import type { Pane } from 'tweakpane';

  const IMAGE =
    'https://images.unsplash.com/photo-1632231484562-3d2bed7e808d?q=80&w=1318&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

  const DEFAULT_BG = '#27272a';
  const DEFAULT_INK = '#f5f5f5';
  const DEFAULT_SHADOW_O = 0.45;
  const AXIS: FlipCardAxis = 'y';

  const params = reactive({
    axis: AXIS,
    flipOnClick: true,
    draggable: true,
    dragDistance: 0,
    tilt: true,
    tiltMax: 12,
    glare: true,
    glareOpacity: 0.22,
    hoverScale: 1.03,
    perspective: 1100,
    stiffness: 170,
    damping: 20,
    width: 300,
    height: 400,
    radius: 22,
    background: DEFAULT_BG,
    color: DEFAULT_INK,
    shadow: true,
    shadowColor: '#000000',
    shadowOpacity: DEFAULT_SHADOW_O,
    disabled: false,
  });

  const colorMode = useColorMode();
  const isLight = computed(() => colorMode.value !== 'dark');
  const background = computed(() =>
    isLight.value && params.background === DEFAULT_BG
      ? '#f6f6f6'
      : params.background,
  );
  const ink = computed(() =>
    isLight.value && params.color === DEFAULT_INK ? '#18181b' : params.color,
  );
  const shadowOpacity = computed(() =>
    isLight.value && params.shadowOpacity === DEFAULT_SHADOW_O
      ? 0.2
      : params.shadowOpacity,
  );

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'axis', {
      options: { Horizontal: 'y', Vertical: 'x' },
    });
    pane.addBinding(params, 'flipOnClick');
    pane.addBinding(params, 'draggable');
    pane.addBinding(params, 'dragDistance', { min: 0, max: 600, step: 10 });
    pane.addBinding(params, 'tilt');
    pane.addBinding(params, 'tiltMax', { min: 0, max: 30, step: 1 });
    pane.addBinding(params, 'glare');
    pane.addBinding(params, 'glareOpacity', { min: 0, max: 0.6, step: 0.02 });
    pane.addBinding(params, 'hoverScale', { min: 1, max: 1.1, step: 0.01 });
    pane.addBinding(params, 'perspective', { min: 400, max: 2400, step: 50 });
    pane.addBinding(params, 'stiffness', { min: 60, max: 500, step: 10 });
    pane.addBinding(params, 'damping', { min: 5, max: 60, step: 1 });
    pane.addBinding(params, 'width', { min: 200, max: 420, step: 10 });
    pane.addBinding(params, 'height', { min: 240, max: 520, step: 10 });
    pane.addBinding(params, 'radius', { min: 0, max: 48, step: 1 });
    pane.addBinding(params, 'background');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'shadow');
    pane.addBinding(params, 'shadowColor');
    pane.addBinding(params, 'shadowOpacity', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'disabled');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import FlipCard from '~/components/ui/flip-card/FlipCard.vue';
</script>

<template>
  <FlipCard :width=&quot;300&quot; :height=&quot;400&quot; aria-label=&quot;Wooded Landscape&quot;>
    <template #front>
      <img src=&quot;/landscape.jpg&quot; alt=&quot;Wooded Landscape&quot; class=&quot;size-full object-cover&quot; />
    </template>
    <template #back>
      <div class=&quot;flex h-full flex-col justify-between p-7&quot;>
        <span class=&quot;text-2xl font-medium&quot;>Wooded Landscape</span>
        <span class=&quot;text-sm opacity-70&quot;>17th century</span>
      </div>
    </template>
  </FlipCard>
</template>`"
  >
    <div
      class="relative flex size-full min-h-140 items-center justify-center overflow-hidden p-6"
    >
      <FlipCard
        :axis="params.axis"
        :flip-on-click="params.flipOnClick"
        :draggable="params.draggable"
        :drag-distance="params.dragDistance"
        :tilt="params.tilt"
        :tilt-max="params.tiltMax"
        :glare="params.glare"
        :glare-opacity="params.glareOpacity"
        :hover-scale="params.hoverScale"
        :perspective="params.perspective"
        :stiffness="params.stiffness"
        :damping="params.damping"
        :width="params.width"
        :height="params.height"
        :radius="params.radius"
        :background="background"
        :color="ink"
        :shadow="params.shadow"
        :shadow-color="params.shadowColor"
        :shadow-opacity="shadowOpacity"
        :disabled="params.disabled"
        aria-label="Wooded Landscape, 17th century. Flip for details"
      >
        <template #front>
          <img
            :src="IMAGE"
            alt="Wooded Landscape, 17th century"
            draggable="false"
            class="block size-full object-cover"
          />
        </template>
        <template #back>
          <div class="fc-demo-back">
            <img :src="IMAGE" alt="" draggable="false" class="fc-demo-photo" />
            <div class="fc-demo-fade" />
            <div class="fc-demo-copy">
              <span class="fc-demo-title">Wooded Landscape</span>
              <div class="fc-demo-meta">
                <span>17th century</span>
                <span>Rijksmuseum</span>
              </div>
            </div>
          </div>
        </template>
      </FlipCard>
      <ShaderPane title="Flip Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>

<style scoped>
  .fc-demo-back {
    position: relative;
    height: 100%;
    text-align: left;
  }

  .fc-demo-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    filter: grayscale(1) contrast(1.1);
    opacity: 0.34;
  }

  .fc-demo-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      var(--fc-bg) 0%,
      color-mix(in srgb, var(--fc-bg) 55%, transparent) 26%,
      transparent 46%,
      transparent 58%,
      color-mix(in srgb, var(--fc-bg) 60%, transparent) 80%,
      var(--fc-bg) 100%
    );
  }

  .fc-demo-copy {
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 26px 28px;
  }

  .fc-demo-title {
    font-size: 27px;
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.03em;
    white-space: nowrap;
  }

  .fc-demo-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    font-size: 14px;
    line-height: 1.2;
    letter-spacing: 0.01em;
    opacity: 0.7;
  }
</style>
