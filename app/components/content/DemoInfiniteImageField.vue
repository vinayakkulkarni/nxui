<script setup lang="ts">
  import InfiniteImageField from '@registry/new-york/infinite-image-field/InfiniteImageField.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<InfiniteImageField :image-width='200' :image-height='280' :gap='28' />`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <InfiniteImageField class="absolute inset-0 size-full" />
    </div>
  </ComponentDemo>
</template>
