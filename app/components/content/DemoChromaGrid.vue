<script setup lang="ts">
  import ChromaGrid from '@registry/new-york/ChromaGrid/ChromaGrid.vue';
</script>

<template>
  <ComponentDemo
    :code="`<ChromaGrid :radius='300' :columns='3' :damping='0.12' />`"
  >
    <div class="relative w-full overflow-hidden rounded-lg bg-black p-4">
      <ChromaGrid :radius="300" :columns="3" :damping="0.12" />
    </div>
  </ComponentDemo>
</template>
