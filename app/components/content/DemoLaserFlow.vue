<script setup lang="ts">
  import LaserFlow from '@registry/new-york/laser-flow/LaserFlow.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LaserFlow from '~/components/ui/LaserFlow.vue';
</script>

<template>
  <LaserFlow color='#B19EEF' :flow-speed='0.35' :wisp-density='1' />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <LaserFlow color="#B19EEF" :flow-speed="0.35" :wisp-density="1" />
    </div>
  </ComponentDemo>
</template>
