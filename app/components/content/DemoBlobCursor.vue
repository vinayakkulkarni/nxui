<script setup lang="ts">
  import BlobCursor from '@registry/new-york/blob-cursor/BlobCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import BlobCursor from '~/components/ui/BlobCursor.vue';
</script>

<template>
  <BlobCursor fill-color='#5227FF' :trail-count='3' blob-type='circle' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <BlobCursor fill-color="#5227FF" :trail-count="3" blob-type="circle">
        <div class="flex size-full items-center justify-center">
          <p class="relative z-10 text-lg text-foreground">Move your cursor</p>
        </div>
      </BlobCursor>
    </div>
  </ComponentDemo>
</template>
