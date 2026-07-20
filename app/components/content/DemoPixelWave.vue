<script setup lang="ts">
  import PixelWave from '@registry/new-york/pixel-wave/PixelWave.vue';
  import type { PixelWaveScene } from '@registry/new-york/pixel-wave/types';

  interface Preset {
    label: string;
    scene: PixelWaveScene;
    title: string;
    caption: string;
  }

  const presets: Preset[] = [
    {
      label: 'Tahiti',
      scene: 'tahiti',
      title: 'A Wave From Tahiti',
      caption:
        'Faded memories of wave breaks. The weight of the ocean, captured and rendered using basic pixel patches.',
    },
    {
      label: 'Desert',
      scene: 'desert',
      title: 'The Desert Horizon',
      caption:
        'Pixels light up, capturing the essence of sun-inspired elements in the desert landscape.',
    },
    {
      label: 'Hearth',
      scene: 'hearth',
      title: 'The Midnight Hearth',
      caption:
        'The mesmerizing, raging dance of fire. Pixels racing through the darkness in finite detail.',
    },
    {
      label: 'Mind',
      scene: 'mind',
      title: 'A Wandering Mind',
      caption:
        'Two separate thoughts, briefly connected. Roaming as one soul, and then separating.',
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
  import PixelWave from '~/components/ui/pixel-wave/PixelWave.vue';
</script>

<template>
  <div class=&quot;bg-neutral-950&quot;>
    <PixelWave scene=&quot;desert&quot; class=&quot;h-100&quot; />
    <h2>The Desert Horizon</h2>
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#f5f1ea] p-6 dark:bg-background"
      >
        <div
          class="flex w-full max-w-sm flex-col gap-5 rounded-xl bg-neutral-950 p-6 shadow-xl sm:max-w-md sm:p-8"
        >
          <div class="relative aspect-square w-full">
            <PixelWave
              :scene="current.scene"
              class="absolute inset-0 size-full"
            />
          </div>
          <div class="text-center">
            <h2 class="font-serif text-xl text-white italic sm:text-2xl">
              {{ current.title }}
            </h2>
            <p
              class="mx-auto mt-2 max-w-70 text-xs/relaxed text-neutral-400 sm:text-sm/relaxed"
            >
              {{ current.caption }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4"
      >
        <div
          class="pointer-events-auto flex gap-2 overflow-x-auto rounded-full border border-border/50 bg-background/80 p-1 backdrop-blur-sm"
        >
          <button
            v-for="(preset, index) in presets"
            :key="preset.scene"
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
