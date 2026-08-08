<script setup lang="ts">
  import DepthDive from '@registry/new-york/depth-dive/DepthDive.vue';

  interface Preset {
    label: string;
    props: Record<string, unknown>;
  }

  const presets: Preset[] = [
    { label: 'Manifesto', props: {} },
    {
      label: 'Psychedelic',
      props: {
        tunnel: 0.55,
        tunnelTwist: 0.9,
        tunnelSpeed: 1,
        psychedelia: 0.4,
        hueDrift: 0.02,
        stars: 0.9,
        streaks: 0.4,
        rgbShift: 0.0025,
        rgbShiftVel: 0.012,
        rgbShiftWarmth: 0.25,
        wobble: 0.0035,
        depthTint: 0.55,
      },
    },
    {
      label: 'Scattered',
      props: {
        scatter: 0.5,
        tilt: 6,
        sway: 1.1,
        headingColor: '#7b5cff',
        accentColor: '#7b5cff',
      },
    },
  ];

  const activePreset = ref(0);
  const current = computed(() => presets[activePreset.value]!);

  function selectPreset(index: number): void {
    activePreset.value = index;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DepthDive from '~/components/ui/depth-dive/DepthDive.vue';
</script>

<template>
  <DepthDive hud-title=&quot;MANIFESTO&quot; class=&quot;h-150&quot; />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <DepthDive
        :key="activePreset"
        v-bind="current.props"
        class="absolute inset-0 size-full"
      />
      <div class="absolute inset-x-0 bottom-10 z-10 flex justify-center">
        <div
          class="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md"
        >
          <button
            v-for="(preset, i) in presets"
            :key="preset.label"
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="
              i === activePreset
                ? 'bg-white/90 text-black'
                : 'text-white/60 hover:text-white'
            "
            @click="selectPreset(i)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
