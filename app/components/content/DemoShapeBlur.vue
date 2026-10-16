<script setup lang="ts">
  import { computed, reactive, watch } from 'vue';
  import ShapeBlur from '@registry/new-york/shape-blur/ShapeBlur.vue';
  import type {
    ShapeBlurProps,
    ShapeBlurShape,
  } from '@registry/new-york/shape-blur/types';
  import type { Pane } from 'tweakpane';

  // The nxui "n" mark, drawn as one stroked path.
  const LOGO_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path d="M168 384V176m0 72a88 88 0 0 1 176 0v136" stroke="#000" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
  const LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG)}`;

  const colorMode = useColorMode();
  const ink = computed(() =>
    colorMode.value === 'light' ? '#120f17' : '#ffffff',
  );

  const LOOK = {
    form: 'logo',
    sides: 6,
    size: 0.6,
    roundness: 0.2,
    thickness: 2,
    fill: true,
    echoes: 1,
    spacing: 14,
    blur: 16,
    lensSize: 0.3,
    lensSoftness: 0.7,
    focus: false,
    chroma: 0.3,
    rotation: 0,
    spin: 0,
    idle: true,
  };

  const PRESETS: Record<string, ShapeBlurProps> = {
    lens: {},
    focus: { focus: true, blur: 18, lensSize: 0.34 },
  };

  const params = reactive({ preset: 'lens', color: '#ffffff', ...LOOK });

  const SHAPE_FORMS: Record<string, ShapeBlurShape> = {
    rect: 'rect',
    circle: 'circle',
    polygon: 'polygon',
    star: 'star',
  };

  const shape = computed<ShapeBlurShape>(
    () => SHAPE_FORMS[params.form] ?? 'rect',
  );
  const src = computed(() => (params.form === 'logo' ? LOGO : undefined));
  const polygonal = computed(
    () => params.form === 'polygon' || params.form === 'star',
  );

  let paneRef: Pane | null = null;
  type Binding = ReturnType<Pane['addBinding']>;
  let sidesBinding: Binding | null = null;

  watch(polygonal, (value) => {
    if (sidesBinding) sidesBinding.hidden = !value;
  });

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.color === previous) {
        params.color = value;
        paneRef?.refresh();
      }
    },
    { immediate: true },
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, PRESETS[name] ?? {}, {
      preset: name,
      color: ink.value,
    });
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: { Lens: 'lens', Focus: 'focus' },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'form', {
      label: 'shape',
      options: {
        Logo: 'logo',
        Rectangle: 'rect',
        Circle: 'circle',
        Polygon: 'polygon',
        Star: 'star',
      },
    });
    sidesBinding = pane.addBinding(params, 'sides', {
      min: 3,
      max: 12,
      step: 1,
    });
    sidesBinding.hidden = !polygonal.value;
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'size', { min: 0.2, max: 1, step: 0.01 });
    pane.addBinding(params, 'roundness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'thickness', { min: 0.5, max: 12, step: 0.5 });
    pane.addBinding(params, 'echoes', { min: 1, max: 20, step: 1 });
    pane.addBinding(params, 'spacing', { min: 4, max: 60, step: 1 });
    pane.addBinding(params, 'blur', { min: 0, max: 80, step: 1 });
    pane.addBinding(params, 'lensSize', { min: 0.05, max: 1, step: 0.01 });
    pane.addBinding(params, 'lensSoftness', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'chroma', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'rotation', { min: -180, max: 180, step: 1 });
    pane.addBinding(params, 'spin', { min: -90, max: 90, step: 1 });
    pane.addBinding(params, 'fill');
    pane.addBinding(params, 'focus');
    pane.addBinding(params, 'idle', { label: 'idle-drift' });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeBlur from '~/components/ui/shape-blur/ShapeBlur.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full&quot;>
    <ShapeBlur
      src=&quot;/logo.svg&quot;
      color=&quot;#ffffff&quot;
      :size=&quot;0.6&quot;
      fill
      :blur=&quot;16&quot;
      :lens-size=&quot;0.3&quot;
      :lens-softness=&quot;0.7&quot;
      :chroma=&quot;0.3&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-125 overflow-hidden">
      <ShapeBlur
        class="absolute inset-0 size-full"
        :shape="shape"
        :src="src"
        :color="params.color"
        :sides="params.sides"
        :size="params.size"
        :roundness="params.roundness"
        :thickness="params.thickness"
        :fill="params.fill"
        :echoes="params.echoes"
        :spacing="params.spacing"
        :blur="params.blur"
        :lens-size="params.lensSize"
        :lens-softness="params.lensSoftness"
        :focus="params.focus"
        :chroma="params.chroma"
        :rotation="params.rotation"
        :spin="params.spin"
        :idle="params.idle"
      />
      <ShaderPane title="Shape Blur" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
