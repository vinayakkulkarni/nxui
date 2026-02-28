<script setup lang="ts">
  import Hyperspeed from '@registry/new-york/Hyperspeed/Hyperspeed.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Hyperspeed from '~/components/ui/Hyperspeed.vue';
</script>

<template>
  <Hyperspeed />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Hyperspeed />
    </div>
  </ComponentDemo>
</template>
