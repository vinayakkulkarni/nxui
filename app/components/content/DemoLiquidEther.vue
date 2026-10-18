<script setup lang="ts">
  import { computed, onMounted, reactive, watch } from 'vue';
  import LiquidEther from '@registry/new-york/liquid-ether/LiquidEther.vue';
  import type { LiquidEtherProps } from '@registry/new-york/liquid-ether/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const LOOK = {
    colors: ['#5227FF', '#FF9FFC', '#B497CF'],
    intensity: 1,
    mouseForce: 20,
    cursorSize: 100,
    persistence: 0.75,
    viscosity: 0,
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    ether: {},
    lagoon: { colors: ['#0e7490', '#2dd4bf', '#ccfbf1'] },
    ember: { colors: ['#9a3412', '#f97316', '#fde68a'] },
    smoke: { colors: ['#3f3f46', '#a1a1aa', '#ffffff'] },
    ocean: { colors: ['#1e3a8a', '#3b82f6', '#bae6fd'] },
    syrup: {
      viscosity: 0.8,
      persistence: 0.9,
      cursorSize: 140,
      intensity: 1.2,
    },
  };

  const PRESET_OPTIONS = [
    { value: 'ether', label: 'Ether' },
    { value: 'lagoon', label: 'Lagoon' },
    { value: 'ember', label: 'Ember' },
    { value: 'smoke', label: 'Smoke' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'syrup', label: 'Syrup' },
  ];

  const ui = reactive({ preset: 'ether' });

  const params = reactive({
    color1: LOOK.colors[0] ?? '#5227FF',
    color2: LOOK.colors[1] ?? '#FF9FFC',
    color3: LOOK.colors[2] ?? '#B497CF',
    intensity: LOOK.intensity,
    mouseForce: LOOK.mouseForce,
    cursorSize: LOOK.cursorSize,
    persistence: LOOK.persistence,
    viscosity: LOOK.viscosity,
    resolution: 0.5,
    autoSpeed: 0.5,
    autoIntensity: 2.2,
    autoDemo: true,
    clickBurst: true,
    bounceEdges: false,
    intro: true,
    lightMode: false,
  });

  let paneRef: Pane | null = null;

  function applyPreset(value: string) {
    const look = { ...LOOK, ...PRESETS[value] };
    params.color1 = look.colors[0] ?? params.color1;
    params.color2 = look.colors[1] ?? params.color2;
    params.color3 = look.colors[2] ?? params.color3;
    params.intensity = look.intensity;
    params.mouseForce = look.mouseForce;
    params.cursorSize = look.cursorSize;
    params.persistence = look.persistence;
    params.viscosity = look.viscosity;
    ui.preset = value;
    paneRef?.refresh();
  }

  function syncLightMode() {
    params.lightMode = colorMode.value === 'light';
    paneRef?.refresh();
  }

  onMounted(syncLightMode);
  watch(() => colorMode.value, syncLightMode);

  const etherProps = computed<LiquidEtherProps>(() => ({
    colors: [params.color1, params.color2, params.color3],
    intensity: params.intensity,
    mouseForce: params.mouseForce,
    cursorSize: params.cursorSize,
    persistence: params.persistence,
    viscosity: params.viscosity,
    resolution: params.resolution,
    autoSpeed: params.autoSpeed,
    autoIntensity: params.autoIntensity,
    autoDemo: params.autoDemo,
    clickBurst: params.clickBurst,
    bounceEdges: params.bounceEdges,
    intro: params.intro,
    lightMode: params.lightMode,
  }));

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(ui, 'preset', {
        options: Object.fromEntries(
          PRESET_OPTIONS.map((option) => [option.label, option.value]),
        ),
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'color1', { label: 'slow' });
    pane.addBinding(params, 'color2', { label: 'mid' });
    pane.addBinding(params, 'color3', { label: 'fast' });
    pane.addBinding(params, 'intensity', { min: 0.3, max: 2, step: 0.05 });
    pane.addBinding(params, 'mouseForce', { min: 0, max: 60, step: 1 });
    pane.addBinding(params, 'cursorSize', { min: 20, max: 300, step: 5 });
    pane.addBinding(params, 'persistence', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'viscosity', { min: 0, max: 1, step: 0.01 });
    pane.addBinding(params, 'resolution', { min: 0.1, max: 1, step: 0.05 });
    pane.addBinding(params, 'autoSpeed', { min: 0, max: 1.5, step: 0.05 });
    pane.addBinding(params, 'autoIntensity', { min: 0, max: 4, step: 0.1 });
    pane.addBinding(params, 'autoDemo');
    pane.addBinding(params, 'clickBurst');
    pane.addBinding(params, 'bounceEdges');
    pane.addBinding(params, 'intro');
    pane.addBinding(params, 'lightMode');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidEther from '~/components/ui/liquid-ether/LiquidEther.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <LiquidEther
      :colors=&quot;['#5227FF', '#FF9FFC', '#B497CF']&quot;
      :intensity=&quot;1&quot;
      :mouse-force=&quot;20&quot;
      :cursor-size=&quot;100&quot;
      :persistence=&quot;0.75&quot;
      :resolution=&quot;0.5&quot;
      :auto-speed=&quot;0.5&quot;
      :auto-intensity=&quot;2.2&quot;
      click-burst
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-125 overflow-hidden rounded-lg"
      :class="params.lightMode ? 'bg-white' : 'bg-[#0b0910]'"
    >
      <LiquidEther v-bind="etherProps" class="absolute inset-0 size-full" />
      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex flex-col items-center gap-4 px-6 text-center"
      >
        <span
          class="rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
          :class="
            params.lightMode
              ? 'border-black/10 bg-white/60 text-neutral-900'
              : 'border-white/20 bg-black/40 text-white'
          "
        >
          Vue ✦ nxui
        </span>
        <p
          class="max-w-xl text-2xl/tight font-semibold tracking-tight text-balance sm:text-4xl/tight"
          :class="
            params.lightMode ? 'text-neutral-900' : 'text-white drop-shadow-lg'
          "
        >
          The web, made fluid at your fingertips.
        </p>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4 pr-14"
      >
        <div
          class="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full border bg-background/60 px-2 py-1.5 text-xs font-medium backdrop-blur"
        >
          <button
            v-for="option in PRESET_OPTIONS"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-1 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              ui.preset === option.value
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            "
            :aria-pressed="ui.preset === option.value"
            @click="applyPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <ShaderPane title="Liquid Ether" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
