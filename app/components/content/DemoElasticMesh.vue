<script setup lang="ts">
  import { computed, reactive, toRef } from 'vue';
  import { refDebounced } from '@vueuse/core';
  import ElasticMesh from '@registry/new-york/elastic-mesh/ElasticMesh.vue';
  import type {
    ElasticMeshMaterial,
    ElasticMeshProps,
  } from '@registry/new-york/elastic-mesh/types';
  import type { Pane } from 'tweakpane';

  // The nxui mark, drawn as a thick stroke so its alpha defines the shape.
  const NXUI_LOGO = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="8 9 16 18"><path d="M10.5 24V11m0 4.5a5.5 5.5 0 0 1 11 0V24" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  )}`;

  const balloon: ElasticMeshMaterial = 'balloon';

  const BALLOON: Required<
    Pick<
      ElasticMeshProps,
      'material' | 'color' | 'inflate' | 'stiffness' | 'wobble'
    >
  > = {
    material: balloon,
    color: '#3b5bff',
    inflate: 1,
    stiffness: 0.5,
    wobble: 0.6,
  };

  const PRESETS: Record<ElasticMeshMaterial, typeof BALLOON> = {
    balloon: BALLOON,
    chrome: {
      ...BALLOON,
      material: 'chrome',
      color: '#ffffff',
      stiffness: 0.65,
      wobble: 0.5,
    },
    jelly: {
      ...BALLOON,
      material: 'jelly',
      color: '#ff5a1f',
      stiffness: 0.35,
      wobble: 0.85,
    },
    clay: {
      ...BALLOON,
      material: 'clay',
      color: '#ece6dc',
      inflate: 0.85,
      stiffness: 0.6,
      wobble: 0.35,
    },
  };

  const MATERIAL_OPTIONS = {
    Balloon: 'balloon',
    Chrome: 'chrome',
    Jelly: 'jelly',
    Clay: 'clay',
  };

  const params = reactive({
    preset: balloon,
    content: 'text',
    text: 'Squish',
    ...BALLOON,
    grabRadius: 70,
    stretch: 0.5,
    press: 0.5,
    shadow: 0.5,
    intro: true,
  });

  const typed = refDebounced(toRef(params, 'text'), 350);
  const colorMode = useColorMode();

  const shape = computed<ElasticMeshProps>(() =>
    params.content === 'logo'
      ? { src: NXUI_LOGO, imageColors: false }
      : { text: typed.value },
  );
  const theme = computed(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  function applyPreset(pane: Pane) {
    Object.assign(params, PRESETS[params.preset], {
      grabRadius: 70,
      stretch: 0.5,
      press: 0.5,
      shadow: 0.5,
      intro: true,
    });
    pane.refresh();
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(params, 'preset', { options: MATERIAL_OPTIONS })
      .on('change', () => applyPreset(pane));
    pane.addBinding(params, 'content', {
      options: { Text: 'text', Logo: 'logo' },
    });
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'material', { options: MATERIAL_OPTIONS });
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'inflate', { min: 0.4, max: 1.6, step: 0.05 });
    pane.addBinding(params, 'stiffness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'wobble', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'grabRadius', { min: 30, max: 160, step: 5 });
    pane.addBinding(params, 'stretch', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'press', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'shadow', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'intro');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ElasticMesh from '~/components/ui/elastic-mesh/ElasticMesh.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <ElasticMesh
      text=&quot;Squish&quot;
      material=&quot;balloon&quot;
      color=&quot;#3b5bff&quot;
      :inflate=&quot;1&quot;
      :stiffness=&quot;0.5&quot;
      :wobble=&quot;0.6&quot;
      :grab-radius=&quot;70&quot;
      :stretch=&quot;0.5&quot;
      :press=&quot;0.5&quot;
      :shadow=&quot;0.5&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <ElasticMesh
        class="absolute inset-0 size-full"
        v-bind="shape"
        :material="params.material"
        :color="params.color"
        :inflate="params.inflate"
        :stiffness="params.stiffness"
        :wobble="params.wobble"
        :grab-radius="params.grabRadius"
        :stretch="params.stretch"
        :press="params.press"
        :shadow="params.shadow"
        :intro="params.intro"
        :theme="theme"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-5 z-10 text-center text-sm text-muted-foreground select-none"
      >
        Press, poke and pull
      </p>
      <ShaderPane title="Elastic Mesh" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
