<script setup lang="ts">
  import RippleGrid from '@registry/new-york/ripple-grid/RippleGrid.vue';
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
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <RippleGrid
        class="absolute inset-0 size-full"
        grid-color="#ffffff"
        :ripple-intensity="0.05"
        :grid-size="10"
      />
    </div>
  </ComponentDemo>
</template>
