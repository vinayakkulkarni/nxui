<script setup lang="ts">
  import RippleGrid from '@registry/new-york/RippleGrid/RippleGrid.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import RippleGrid from '~/components/ui/RippleGrid.vue';
</script>

<template>
  <RippleGrid grid-color='#ffffff' :ripple-intensity='0.05' :grid-size='10' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <RippleGrid
        grid-color="#ffffff"
        :ripple-intensity="0.05"
        :grid-size="10"
      />
    </div>
  </ComponentDemo>
</template>
