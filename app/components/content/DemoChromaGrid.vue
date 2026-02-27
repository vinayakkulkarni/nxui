<script setup lang="ts">
  import ChromaGrid from '@registry/new-york/ChromaGrid/ChromaGrid.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import ChromaGrid from '~/components/ui/ChromaGrid.vue';
</script>

<template>
  <ChromaGrid :radius=&quot;300&quot; :columns=&quot;3&quot; :damping=&quot;0.12&quot; />
</template>`"
  >
    <div class="relative w-full overflow-hidden bg-background py-6">
      <ChromaGrid :radius="300" :columns="3" :damping="0.12" />
    </div>
  </ComponentDemo>
</template>
