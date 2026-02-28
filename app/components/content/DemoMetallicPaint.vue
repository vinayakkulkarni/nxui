<script setup lang="ts">
  import MetallicPaint from '@registry/new-york/MetallicPaint/MetallicPaint.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MetallicPaint from '~/components/ui/MetallicPaint.vue';
</script>

<template>
  <MetallicPaint image-src='https://picsum.photos/800/600' :speed='0.3' :mouse-animation='true' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <MetallicPaint
        image-src="https://picsum.photos/800/600"
        :speed="0.3"
        :mouse-animation="true"
      />
    </div>
  </ComponentDemo>
</template>
