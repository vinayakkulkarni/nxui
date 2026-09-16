<script setup lang="ts">
  import GridScan from '@registry/new-york/grid-scan/GridScan.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GridScan from '~/components/ui/GridScan.vue';
</script>

<template>
  <GridScan scan-color='#FF9FFC' scan-direction='pingpong' :enable-post='true' />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <GridScan
        class="absolute inset-0 size-full"
        scan-color="#FF9FFC"
        scan-direction="pingpong"
        :enable-post="true"
      />
    </div>
  </ComponentDemo>
</template>
