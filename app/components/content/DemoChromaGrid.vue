<script setup lang="ts">
  import ChromaGrid from '@registry/new-york/ChromaGrid/ChromaGrid.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<ChromaGrid :radius=&quot;300&quot; :columns=&quot;3&quot; :damping=&quot;0.12&quot; />`"
  >
    <div class="relative w-full overflow-hidden bg-black py-6">
      <ChromaGrid :radius="300" :columns="3" :damping="0.12" />
    </div>
  </ComponentDemo>
</template>
