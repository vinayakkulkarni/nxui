<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useIntervalFn } from '@vueuse/core';
  import SegmentDisplay from '@registry/new-york/segment-display/SegmentDisplay.vue';

  // Deterministic "live" readings, so server and client render the same.
  const tick = ref(0);
  useIntervalFn(() => tick.value++, 900);

  const power = computed(() =>
    (4.6 + Math.sin(tick.value / 2) * 0.3).toFixed(2),
  );
  const battery = computed(() => String(62 + (tick.value % 5)));
  const clock = computed(() => {
    const minutes = 14 * 60 + 20 + tick.value;
    const h = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  });
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SegmentDisplay from '~/components/ui/segment-display/SegmentDisplay.vue';
</script>

<template>
  <SegmentDisplay value=&quot;4.82&quot; color=&quot;#f59e0b&quot; class=&quot;text-6xl&quot; />
  <SegmentDisplay value=&quot;64&quot; color=&quot;#4ade80&quot; class=&quot;text-3xl&quot; />
  <SegmentDisplay value=&quot;14:20&quot; :digits=&quot;4&quot; class=&quot;text-3xl&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div
        class="grid w-full max-w-md gap-6 rounded-2xl border border-border bg-card p-6"
      >
        <div class="rounded-xl bg-zinc-950 p-5 ring-1 ring-white/5">
          <p class="text-xs tracking-widest text-amber-500/80 uppercase">
            Solar producing
          </p>
          <div class="mt-2 flex items-end gap-2">
            <SegmentDisplay
              :value="power"
              color="#f59e0b"
              class="text-6xl"
              label="Solar power"
            />
            <span class="pb-1 text-sm text-amber-500/80">kW</span>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs tracking-widest text-zinc-400 uppercase">
                Battery
              </p>
              <div class="mt-1 flex items-end gap-1">
                <SegmentDisplay
                  :value="battery"
                  color="#4ade80"
                  class="text-3xl"
                  label="Battery level"
                />
                <span class="text-xs text-green-400/80">%</span>
              </div>
            </div>
            <div>
              <p class="text-xs tracking-widest text-zinc-400 uppercase">
                Time
              </p>
              <SegmentDisplay
                :value="clock"
                color="#93c5fd"
                class="mt-1 text-3xl"
                label="Time"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
