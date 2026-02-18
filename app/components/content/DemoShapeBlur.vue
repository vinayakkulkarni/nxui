<script setup lang="ts">
  import ShapeBlur from '@registry/new-york/ShapeBlur/ShapeBlur.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeBlur from '~/components/ui/ShapeBlur.vue';
</script>

<template>
  <ShapeBlur :variation='0' :shape-size='1.2' :roundness='0.4' :border-size='0.05' :circle-size='0.3' :circle-edge='0.5' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <ShapeBlur
        :variation="0"
        :shape-size="1.2"
        :roundness="0.4"
        :border-size="0.05"
        :circle-size="0.3"
        :circle-edge="0.5"
      />
    </div>
  </ComponentDemo>
</template>
