<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ParticleText from '@registry/new-york/particle-text/ParticleText.vue';
  import type {
    ParticleTextProps,
    ParticleTextTrigger,
  } from '@registry/new-york/particle-text/types';
  import type { Pane } from 'tweakpane';

  const DEFAULT_INK = '#ffffff';
  const DEFAULT_TRIGGER: ParticleTextTrigger = 'mount';

  const LOOK: Required<
    Pick<
      ParticleTextProps,
      | 'highlightColor'
      | 'intro'
      | 'gatherDuration'
      | 'stagger'
      | 'scatter'
      | 'clickBurst'
      | 'burstStrength'
      | 'pointerRepel'
      | 'repelRadius'
      | 'idleDrift'
      | 'shape'
      | 'highlightMode'
      | 'particleSize'
      | 'density'
      | 'glow'
    >
  > = {
    highlightColor: '#ff5a36',
    intro: 'gather',
    gatherDuration: 1600,
    stagger: 420,
    scatter: 190,
    clickBurst: true,
    burstStrength: 1,
    pointerRepel: 42,
    repelRadius: 120,
    idleDrift: 0.8,
    shape: 'circle',
    highlightMode: 'motion',
    particleSize: 2.2,
    density: 4,
    glow: true,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    ember: {},
    rain: {
      highlightColor: '#4f8dff',
      intro: 'rain',
      gatherDuration: 1900,
      stagger: 760,
      scatter: 120,
      burstStrength: 1.3,
      pointerRepel: 34,
      repelRadius: 110,
      idleDrift: 0,
      shape: 'line',
      particleSize: 1.7,
      density: 4,
      glow: false,
    },
    vortex: {
      highlightColor: '#8e8e98',
      intro: 'spiral',
      gatherDuration: 2600,
      stagger: 650,
      scatter: 240,
      burstStrength: 1.7,
      pointerRepel: 30,
      repelRadius: 150,
      idleDrift: 1.3,
      particleSize: 1.5,
      density: 2,
      glow: false,
    },
    scan: {
      highlightColor: '#22c55e',
      intro: 'scan',
      gatherDuration: 1800,
      stagger: 240,
      scatter: 120,
      burstStrength: 0.8,
      pointerRepel: 24,
      repelRadius: 90,
      idleDrift: 0,
      shape: 'square',
      particleSize: 3,
      density: 5,
      glow: false,
    },
  };

  const params = reactive({
    preset: 'ember',
    text: 'Future Interfaces',
    color: DEFAULT_INK,
    ...LOOK,
    trigger: DEFAULT_TRIGGER,
    fontWeight: 800,
  });

  const replayKey = ref(0);
  let paneRef: Pane | null = null;
  const color = computed(() =>
    params.color === DEFAULT_INK ? 'currentColor' : params.color,
  );

  function replay() {
    replayKey.value++;
  }

  function applyPreset() {
    Object.assign(params, LOOK, PRESETS[params.preset]);
    paneRef?.refresh();
    replay();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Ember: 'ember',
          Rain: 'rain',
          Vortex: 'vortex',
          Scan: 'scan',
        },
      })
      .on('change', applyPreset);
    pane.addBinding(params, 'text');
    pane.addBinding(params, 'color');
    pane.addBinding(params, 'highlightColor');
    pane
      .addBinding(params, 'intro', {
        options: {
          Gather: 'gather',
          Rain: 'rain',
          Spiral: 'spiral',
          Scan: 'scan',
        },
      })
      .on('change', replay);
    pane.addBinding(params, 'trigger', {
      options: { Mount: 'mount', Hover: 'hover', Click: 'click' },
    });
    pane.addBinding(params, 'gatherDuration', {
      min: 500,
      max: 3000,
      step: 100,
    });
    pane.addBinding(params, 'stagger', { min: 0, max: 900, step: 30 });
    pane.addBinding(params, 'scatter', { min: 40, max: 320, step: 10 });
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'burstStrength', { min: 0.2, max: 2.5, step: 0.1 });
    pane.addBinding(params, 'pointerRepel', { min: 0, max: 90, step: 2 });
    pane.addBinding(params, 'repelRadius', { min: 40, max: 220, step: 5 });
    pane.addBinding(params, 'idleDrift', { min: 0, max: 2, step: 0.1 });
    pane.addBinding(params, 'shape', {
      options: { Circle: 'circle', Square: 'square', Line: 'line' },
    });
    pane.addBinding(params, 'highlightMode', {
      options: { Motion: 'motion', Gradient: 'gradient' },
    });
    pane.addBinding(params, 'fontWeight', {
      options: { '500': 500, '650': 650, '800': 800, '900': 900 },
    });
    pane.addBinding(params, 'particleSize', { min: 1, max: 4, step: 0.1 });
    pane.addBinding(params, 'density', { min: 2, max: 8, step: 1 });
    pane.addBinding(params, 'glow');
    pane.addButton({ title: 'Replay' }).on('click', replay);
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ParticleText from '~/components/ui/particle-text/ParticleText.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full&quot;>
    <ParticleText
      text=&quot;Future Interfaces&quot;
      highlight-color=&quot;#ff5a36&quot;
      intro=&quot;gather&quot;
      :particle-size=&quot;2.2&quot;
      :density=&quot;4&quot;
      :pointer-repel=&quot;42&quot;
      :idle-drift=&quot;0.8&quot;
      font-size=&quot;clamp(3.5rem, 13vw, 9rem)&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80 text-foreground">
      <ParticleText
        :key="`${params.preset}-${replayKey}`"
        class="absolute inset-0 size-full"
        :text="params.text"
        :color="color"
        :highlight-color="params.highlightColor"
        :intro="params.intro"
        :trigger="params.trigger"
        :gather-duration="params.gatherDuration"
        :stagger="params.stagger"
        :scatter="params.scatter"
        :click-burst="params.clickBurst"
        :burst-strength="params.burstStrength"
        :pointer-repel="params.pointerRepel"
        :repel-radius="params.repelRadius"
        :idle-drift="params.idleDrift"
        :shape="params.shape"
        :highlight-mode="params.highlightMode"
        :particle-size="params.particleSize"
        :density="params.density"
        :glow="params.glow"
        :font-weight="params.fontWeight"
        font-size="clamp(3.5rem, 13vw, 9rem)"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center text-xs text-muted-foreground"
      >
        move the cursor through the text · click to burst
      </p>
      <ShaderPane title="Particle Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
