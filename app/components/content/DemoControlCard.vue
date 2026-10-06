<script setup lang="ts">
  import { ref } from 'vue';
  import ControlCard from '@registry/new-york/control-card/ControlCard.vue';

  const wifi = ref(true);
  const tv = ref(true);
  const car = ref(true);
  const purifier = ref(false);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ControlCard from '~/components/ui/control-card/ControlCard.vue';

  const on = ref(true);
</script>

<template>
  <!-- Place over a photo or colorful background for the glass effect -->
  <ControlCard
    v-model:on=&quot;on&quot;
    category=&quot;Wi-Fi&quot;
    name=&quot;Starlink Internet&quot;
    icon=&quot;wifi&quot;
    :stat=&quot;{ icon: 'gauge', value: 'Speed ~ 1GB', label: 'Active' }&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center overflow-hidden bg-neutral-700 bg-[url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80&auto=format&fit=crop')] bg-cover bg-center p-6"
    >
      <div aria-hidden="true" class="absolute inset-0 bg-black/15" />
      <div class="relative grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <ControlCard
          v-model:on="wifi"
          category="Wi-Fi"
          name="Starlink Internet"
          icon="wifi"
          :stat="{ icon: 'gauge', value: 'Speed ~ 1GB', label: 'Active' }"
        />
        <ControlCard
          v-model:on="tv"
          category="TV"
          name="LG 45 UHD TV 4K"
          icon="monitor"
          :stat="{ icon: 'clock', value: '1h 45m', label: 'Screen time' }"
        />
        <ControlCard
          v-model:on="car"
          category="Car"
          name="Tesla Model S"
          icon="car"
          :stat="{
            icon: 'battery-charging',
            value: '53%',
            label: 'Battery charge',
          }"
        />
        <ControlCard
          v-model:on="purifier"
          category="Air Purifier"
          name="Dyson Formaldehyde BP04"
          icon="fan"
          :stat="{ icon: 'clock', value: '4h3m ago', label: 'Last cleaned' }"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
