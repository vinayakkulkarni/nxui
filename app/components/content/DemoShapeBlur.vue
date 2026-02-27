<script setup lang="ts">
  import ShapeBlur from '@registry/new-york/ShapeBlur/ShapeBlur.vue';

  const colorMode = useColorMode();
  const shapeColor = computed(() =>
    colorMode.value === 'light' ? '#000000' : '#ffffff',
  );
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ShapeBlur from '~/components/ui/ShapeBlur.vue';
</script>

<template>
  <ShapeBlur :variation='0' :shape-size='1.2' :roundness='0.4' :border-size='0.05' :circle-size='0.3' :circle-edge='0.5' :shape-color='shapeColor' />
</template>`"
  >
    <div
      class="relative h-[400px] w-full overflow-hidden rounded-lg bg-background"
    >
      <ShapeBlur
        :variation="0"
        :shape-size="1.2"
        :roundness="0.4"
        :border-size="0.05"
        :circle-size="0.3"
        :circle-edge="0.5"
        :shape-color="shapeColor"
      />
    </div>
  </ComponentDemo>
</template>
