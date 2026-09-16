<script setup lang="ts">
  import Radar from '@registry/new-york/radar/Radar.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Radar from '~/components/ui/Radar.vue';
</script>

<template>
  <Radar />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <ClientOnly><Radar /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
