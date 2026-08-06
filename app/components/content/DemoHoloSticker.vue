<script setup lang="ts">
  import HoloSticker from '@registry/new-york/holo-sticker/HoloSticker.vue';
  import type { StickerSettings } from '@registry/new-york/holo-sticker/types';

  interface Preset {
    label: string;
    settings: Partial<StickerSettings>;
  }

  const presets: Preset[] = [
    {
      label: 'Holo',
      settings: { finish: 'holo', holoIntensity: 0.85, bands: 12, grain: 0.15 },
    },
    {
      label: 'Chrome',
      settings: { finish: 'chrome', holoIntensity: 0.25, grain: 0 },
    },
    {
      label: 'Gloss',
      settings: { finish: 'gloss', holoIntensity: 0.4, grain: 0 },
    },
    {
      label: 'Matte',
      settings: { finish: 'matte', holoIntensity: 0.15, grain: 0.08 },
    },
    {
      label: 'Glitter',
      settings: { finish: 'glitter', holoIntensity: 1, grain: 1, bands: 9 },
    },
  ];

  const activePreset = ref(0);
  const current = computed(() => presets[activePreset.value]!);
  const peel = ref(0.31);

  function selectPreset(index: number): void {
    activePreset.value = index;
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import HoloSticker from '~/components/ui/holo-sticker/HoloSticker.vue';
</script>

<template>
  <HoloSticker
    src=&quot;/holo-sticker-demo.svg&quot;
    :settings=&quot;{ finish: 'holo', holoIntensity: 0.85, peelAmount: 0.31 }&quot;
    class=&quot;h-120&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80">
      <HoloSticker
        :src="'/holo-sticker-demo.svg'"
        :settings="{ ...current.settings, peelAmount: peel }"
        class="absolute inset-0 size-full"
      />
      <div class="absolute inset-x-0 top-4 z-10 flex justify-center">
        <div
          class="flex flex-wrap items-center justify-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md"
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
      <div
        class="absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2"
      >
        <input
          v-model.number="peel"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="w-40 accent-white/80"
          aria-label="Peel amount"
        />
        <p class="pointer-events-none text-center text-xs text-white/50">
          move your cursor — the foil sweeps toward it
        </p>
      </div>
    </div>
  </ComponentDemo>
</template>
