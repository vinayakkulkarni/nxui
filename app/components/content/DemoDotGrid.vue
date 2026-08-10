<script setup lang="ts">
  import DotGrid from '@registry/new-york/dot-grid/DotGrid.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DotGrid from '~/components/ui/DotGrid.vue';
</script>

<template>
  <DotGrid :dot-size='16' :gap='32' base-color='#5227FF' active-color='#5227FF' :proximity='150' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <DotGrid
        class="absolute inset-0 size-full"
        :dot-size="16"
        :gap="32"
        base-color="#5227FF"
        active-color="#5227FF"
        :proximity="150"
      />
    </div>
  </ComponentDemo>
</template>
