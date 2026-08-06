<script setup lang="ts">
  import TimezoneCompanion from '@registry/new-york/timezone-companion/TimezoneCompanion.vue';
  import type { TimezoneMode } from '@registry/new-york/timezone-companion/types';

  interface Preset {
    label: string;
    mode: TimezoneMode;
  }

  const presets: Preset[] = [
    { label: 'Meeting', mode: 'meeting' },
    { label: 'Clock', mode: 'clock' },
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
</script>

<template>
  <TimezoneCompanion mode=&quot;meeting&quot; class=&quot;h-120&quot; />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <div class="flex size-full items-center justify-center p-6">
        <TimezoneCompanion :mode="current.mode" />
      </div>
      <div class="absolute inset-x-0 top-4 z-10 flex justify-center">
        <div
          class="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md dark:border-white/6"
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
