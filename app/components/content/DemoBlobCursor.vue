<script setup lang="ts">
  import BlobCursor from '@registry/new-york/BlobCursor/BlobCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<BlobCursor fill-color='#5227FF' :trail-count='3' blob-type='circle' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <BlobCursor fill-color="#5227FF" :trail-count="3" blob-type="circle">
        <div class="flex size-full items-center justify-center">
          <p class="relative z-10 text-lg text-white">Move your cursor</p>
        </div>
      </BlobCursor>
    </div>
  </ComponentDemo>
</template>
