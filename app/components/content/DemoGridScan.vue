<script setup lang="ts">
  import GridScan from '@registry/new-york/GridScan/GridScan.vue';
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
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <GridScan
        scan-color="#FF9FFC"
        scan-direction="pingpong"
        :enable-post="true"
      />
    </div>
  </ComponentDemo>
</template>
