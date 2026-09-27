<script setup lang="ts">
  import { ref } from 'vue';
  import ControlCard from '@registry/new-york/control-card/ControlCard.vue';

  const lights = ref(true);
  const brightness = ref(72);
  const thermostat = ref(true);
  const temperature = ref(44);
  const speaker = ref(false);
  const volume = ref(35);
  const purifier = ref(false);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ControlCard from '~/components/ui/control-card/ControlCard.vue';

  const on = ref(true);
  const brightness = ref(72);
</script>

<template>
  <ControlCard
    v-model:on=&quot;on&quot;
    v-model:level=&quot;brightness&quot;
    name=&quot;Ceiling lights&quot;
    location=&quot;Living room&quot;
    icon=&quot;lamp-ceiling&quot;
    stat=&quot;4 bulbs&quot;
    level-label=&quot;Brightness&quot;
    color=&quot;oklch(0.8 0.16 80)&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden p-6"
    >
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-radial-[at_20%_20%] from-amber-300/30 via-transparent to-transparent dark:from-amber-500/15"
      />
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-radial-[at_85%_80%] from-sky-400/30 via-transparent to-transparent dark:from-sky-500/15"
      />
      <div class="relative grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <ControlCard
          v-model:on="lights"
          v-model:level="brightness"
          name="Ceiling lights"
          location="Living room"
          icon="lamp-ceiling"
          stat="4 bulbs"
          level-label="Brightness"
          color="oklch(0.8 0.16 80)"
        />
        <ControlCard
          v-model:on="thermostat"
          v-model:level="temperature"
          name="Thermostat"
          location="Hallway"
          icon="thermometer"
          stat="21.5°C"
          level-label="Target"
          color="oklch(0.7 0.19 35)"
        />
        <ControlCard
          v-model:on="speaker"
          v-model:level="volume"
          name="Speaker"
          location="Kitchen"
          icon="speaker"
          stat="Playing"
          level-label="Volume"
          color="oklch(0.65 0.2 290)"
        />
        <ControlCard
          v-model:on="purifier"
          name="Air purifier"
          location="Bedroom"
          icon="wind"
          stat="PM2.5 · 8 µg/m³"
          color="oklch(0.72 0.14 200)"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
