<script setup lang="ts">
  import HoloCloth from '@registry/new-york/holo-cloth/HoloCloth.vue';
  import type { HoloClothPreset } from '@registry/new-york/holo-cloth/types';

  interface Preset {
    label: string;
    preset: HoloClothPreset;
  }

  const presets: Preset[] = [
    { label: 'Holo', preset: 'holo' },
    { label: 'Chrome', preset: 'chrome' },
    { label: 'Black Cloth', preset: 'black-cloth' },
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
  import HoloCloth from '~/components/ui/holo-cloth/HoloCloth.vue';
</script>

<template>
  <HoloCloth preset=&quot;holo&quot; class=&quot;h-120&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <HoloCloth :preset="current.preset" class="absolute inset-0 size-full" />
      <p
        class="pointer-events-none absolute inset-x-0 top-4 z-10 text-center text-xs text-white/50"
      >
        grab the cloth and pull — drag empty space to orbit
      </p>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex gap-2 overflow-x-auto rounded-full border border-border/50 bg-background/80 p-1 backdrop-blur-sm"
        >
          <button
            v-for="(preset, index) in presets"
            :key="preset.preset"
            class="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
            :class="
              activePreset === index
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectPreset(index)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
