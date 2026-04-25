<script setup lang="ts">
  import PlasmaWave from '@registry/new-york/plasma-wave/PlasmaWave.vue';

  const colors: [string, string] = ['#A855F7', '#06B6D4'];

  const code = `<script setup lang="ts">
  import PlasmaWave from '~/components/ui/PlasmaWave.vue';
</script>

<template>
  <PlasmaWave
    :colors="['#A855F7', '#06B6D4']"
    :focal-length="0.8"
    :speed-1="0.05"
    :speed-2="0.05"
    :bend-1="1"
    :bend-2="0.5"
  />
</template>`;
</script>

<template>
  <ComponentDemo :code="code">
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <PlasmaWave
        :colors="colors"
        :focal-length="0.8"
        :speed-1="0.05"
        :speed-2="0.05"
        :bend-1="1"
        :bend-2="0.5"
      />
    </div>
  </ComponentDemo>
</template>
