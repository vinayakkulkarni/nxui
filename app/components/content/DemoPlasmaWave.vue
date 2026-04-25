<script setup lang="ts">
  import PlasmaWave from '@registry/new-york/plasma-wave/PlasmaWave.vue';

  const colors: [string, string] = ['#A855F7', '#06B6D4'];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PlasmaWave from '~/components/ui/PlasmaWave.vue';
</script>

<template>
  <PlasmaWave
    :colors=&quot;['#A855F7', '#06B6D4']&quot;
    :focal-length=&quot;0.8&quot;
    :speed-1=&quot;0.05&quot;
    :speed-2=&quot;0.05&quot;
    :bend-1=&quot;1&quot;
    :bend-2=&quot;0.5&quot;
  />
</template>`"
  >
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
