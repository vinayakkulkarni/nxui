<script setup lang="ts">
  import { computed, reactive } from 'vue';
  import LensClock from '@registry/new-york/lens-clock/LensClock.vue';
  import type { LensClockTheme } from '@registry/new-york/lens-clock/types';
  import type { Pane } from 'tweakpane';

  const ZONES = {
    'My zone': '',
    'San Francisco': 'America/Los_Angeles',
    'New York': 'America/New_York',
    London: 'Europe/London',
    Mumbai: 'Asia/Kolkata',
    Tokyo: 'Asia/Tokyo',
  };
  const THEMES = { Auto: '', Light: 'light', Dark: 'dark' };

  const params = reactive({
    timeZone: '',
    theme: '',
    size: 288,
    freeze: false,
    hour: 10,
    minute: 9,
    second: 30,
  });

  const timeZone = computed(() => params.timeZone || undefined);
  const theme = computed<LensClockTheme | undefined>(() =>
    params.theme === 'light' || params.theme === 'dark'
      ? params.theme
      : undefined,
  );
  const fixedTime = computed(() =>
    params.freeze
      ? new Date(
          Date.UTC(2026, 0, 1, params.hour, params.minute, params.second),
        )
      : undefined,
  );
  // A frozen moment is built in UTC, so show it in UTC unless a city is picked.
  const shownZone = computed(() =>
    params.freeze ? (timeZone.value ?? 'UTC') : timeZone.value,
  );
  const sizeStyle = computed(() => ({ width: `${params.size}px` }));

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'timeZone', { label: 'zone', options: ZONES });
    pane.addBinding(params, 'theme', { options: THEMES });
    pane.addBinding(params, 'size', { min: 160, max: 360, step: 4 });
    pane.addBinding(params, 'freeze', { label: 'fixed time' });
    pane.addBinding(params, 'hour', { min: 0, max: 23, step: 1 });
    pane.addBinding(params, 'minute', { min: 0, max: 59, step: 1 });
    pane.addBinding(params, 'second', { min: 0, max: 59, step: 1 });
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LensClock from '~/components/ui/lens-clock/LensClock.vue';
</script>

<template>
  <div class=&quot;flex flex-wrap justify-center gap-6&quot;>
    <LensClock />
    <LensClock time-zone=&quot;America/New_York&quot; theme=&quot;dark&quot; class=&quot;w-52&quot; />
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <LensClock
        :time-zone="shownZone"
        :theme="theme"
        :time="fixedTime"
        class="max-w-full"
        :style="sizeStyle"
      />
      <ShaderPane title="Lens Clock" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
