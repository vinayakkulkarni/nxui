<script setup lang="ts">
  import PaperTexture from '@registry/new-york/paper-texture/PaperTexture.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperTexture from '~/components/ui/paper-texture/PaperTexture.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperTexture image=&quot;/flowers.webp&quot; :folds=&quot;0.65&quot; :fiber=&quot;0.3&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperTexture image="/flowers.webp" :folds="0.65" :fiber="0.3" />
    </div>
  </ComponentDemo>
</template>
