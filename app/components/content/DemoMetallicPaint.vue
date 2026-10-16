<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref } from 'vue';
  import MetallicPaint from '@registry/new-york/metallic-paint/MetallicPaint.vue';
  import type { MetallicPaintProps } from '@registry/new-york/metallic-paint/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path d="M168 384V176m0 72a88 88 0 0 1 176 0v136" stroke="#000" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  )}`;

  const LOOK: MetallicPaintProps = {
    text: 'nxui',
    color: '#ffffff',
    density: 2,
    softness: 0.1,
    dispersion: 0.3,
    distortion: 0.07,
    edgeBend: 0.6,
    angle: 70,
    scale: 0.6,
  };

  const PRESETS: Record<string, MetallicPaintProps> = {
    chrome: LOOK,
    liquid: {
      ...LOOK,
      edgeBend: 0.92,
      distortion: 0.22,
      density: 2.6,
      dispersion: 0.45,
    },
    noir: {
      ...LOOK,
      color: '#b4b4ba',
      softness: 0.6,
      density: 1.6,
      dispersion: 0,
      distortion: 0.05,
      edgeBend: 0.5,
      angle: 90,
    },
    gold: {
      ...LOOK,
      text: 'Gold',
      color: '#f2c46b',
      dispersion: 0.15,
      scale: 0.7,
    },
    prism: {
      ...LOOK,
      color: '#9cc4ff',
      softness: 0.8,
      density: 6,
      dispersion: 1,
      distortion: 0.4,
      edgeBend: 0.4,
      angle: 0,
    },
    brushed: {
      ...LOOK,
      softness: 1,
      density: 2.5,
      dispersion: 0,
      distortion: 0,
      edgeBend: 0.5,
      angle: 100,
    },
  };

  const params = reactive({
    preset: 'chrome',
    content: 'logo',
    text: 'nxui',
    color: '#ffffff',
    density: 2,
    softness: 0.1,
    dispersion: 0.3,
    distortion: 0.07,
    edgeBend: 0.6,
    angle: 70,
    speed: 1,
    scale: 0.6,
    rotation: 0,
    mouseTilt: 0.5,
    intro: true,
  });

  const fileInput = ref<HTMLInputElement | null>(null);
  const upload = ref<string | null>(null);
  const mountKey = ref(0);
  let paneRef: Pane | null = null;

  const isLight = computed(() => colorMode.value === 'light');
  const imageSrc = computed(() =>
    params.content === 'logo' ? (upload.value ?? LOGO) : undefined,
  );
  const text = computed(() =>
    params.content === 'text' ? params.text || 'nxui' : undefined,
  );

  function applyPreset(name: string) {
    const preset = PRESETS[name] ?? LOOK;
    Object.assign(params, {
      color: preset.color,
      density: preset.density,
      softness: preset.softness,
      dispersion: preset.dispersion,
      distortion: preset.distortion,
      edgeBend: preset.edgeBend,
      angle: preset.angle,
      scale: preset.scale,
      text: preset.text,
      content: name === 'gold' ? 'text' : 'logo',
      speed: 1,
      rotation: 0,
      mouseTilt: 0.5,
    });
    paneRef?.refresh();
    mountKey.value++;
  }

  function revokeUpload() {
    if (upload.value) URL.revokeObjectURL(upload.value);
    upload.value = null;
  }

  function onFile(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    revokeUpload();
    upload.value = URL.createObjectURL(file);
    params.content = 'logo';
    paneRef?.refresh();
  }

  onBeforeUnmount(revokeUpload);

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Chrome: 'chrome',
          Liquid: 'liquid',
          Noir: 'noir',
          Gold: 'gold',
          Prism: 'prism',
          Brushed: 'brushed',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'content', {
      options: { Logo: 'logo', Text: 'text' },
    });
    pane
      .addButton({ title: 'Upload SVG or PNG' })
      .on('click', () => fileInput.value?.click());
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'density', { min: 0.5, max: 8, step: 0.1 });
    pane.addBinding(params, 'softness', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'dispersion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'distortion', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'edgeBend', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'angle', { min: 0, max: 360, step: 1 });
    pane.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    pane.addBinding(params, 'scale', { min: 0.2, max: 1.2, step: 0.01 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'mouseTilt', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'intro').on('change', () => mountKey.value++);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MetallicPaint from '~/components/ui/metallic-paint/MetallicPaint.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <MetallicPaint
      image-src=&quot;/logo.svg&quot;
      color=&quot;#ffffff&quot;
      :density=&quot;2&quot;
      :softness=&quot;0.1&quot;
      :dispersion=&quot;0.3&quot;
      :distortion=&quot;0.07&quot;
      :edge-bend=&quot;0.6&quot;
      :angle=&quot;70&quot;
      :speed=&quot;1&quot;
      :scale=&quot;0.6&quot;
      :mouse-tilt=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden">
      <MetallicPaint
        :key="mountKey"
        class="absolute inset-0 size-full"
        :image-src="imageSrc"
        :text="text"
        font-family="Geist, system-ui, sans-serif"
        :color="params.color"
        :density="params.density"
        :softness="params.softness"
        :dispersion="params.dispersion"
        :distortion="params.distortion"
        :edge-bend="params.edgeBend"
        :angle="params.angle"
        :speed="params.speed"
        :scale="params.scale"
        :rotation="params.rotation"
        :mouse-tilt="params.mouseTilt"
        :intro="params.intro"
        :light-mode="isLight"
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/svg+xml,image/png,image/webp"
        class="hidden"
        aria-label="Upload a logo to paint"
        @change="onFile"
      />
      <ShaderPane
        expanded
        title="Metallic Paint"
        @on-pane-created="onPaneCreated"
      />
    </div>
  </ComponentDemo>
</template>
