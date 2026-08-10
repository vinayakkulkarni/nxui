<script setup lang="ts">
  import TimezoneCompanion from '@registry/new-york/timezone-companion/TimezoneCompanion.vue';
  import type { TimezoneMode } from '@registry/new-york/timezone-companion/types';

  const presets: DemoModePreset<TimezoneMode>[] = [
    { label: 'Meeting Finder', mode: 'meeting' },
    { label: 'World Clock', mode: 'clock' },
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
  import TimezoneCompanion from '~/components/ui/timezone-companion/TimezoneCompanion.vue';
  import type { DemoModePreset } from '~/types/components';
</script>

<template>
  <TimezoneCompanion mode=&quot;meeting&quot; />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <div
        class="flex size-full items-center justify-center bg-zinc-200/60 p-6 pt-16 dark:bg-zinc-950/40"
      >
        <TimezoneCompanion :key="current.mode" :mode="current.mode" />
      </div>
      <div class="absolute inset-x-0 top-4 z-10 flex justify-center">
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
