<script setup lang="ts">
  import InfiniteImageField from '@registry/new-york/infinite-image-field/InfiniteImageField.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<InfiniteImageField :image-width='200' :image-height='280' :gap='28' />`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <InfiniteImageField class="size-full" />
    </div>
  </ComponentDemo>
</template>
