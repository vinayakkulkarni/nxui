<script setup lang="ts">
  import Cubes from '@registry/new-york/Cubes/Cubes.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Cubes from '~/components/ui/Cubes.vue';
</script>

<template>
  <Cubes :grid-size='10' :max-angle='45' :radius='3' face-color='#060010' border-style='1px solid #fff' />
</template>`"
  >
    <div
      class="flex h-[400px] w-full items-center justify-center rounded-lg bg-background p-4"
    >
      <Cubes
        :grid-size="10"
        :max-angle="45"
        :radius="3"
        face-color="#060010"
        border-style="1px solid #fff"
        class="max-w-[400px]"
      />
    </div>
  </ComponentDemo>
</template>
