<script setup lang="ts">
  import PaperFlutedGlass from '@registry/new-york/paper-fluted-glass/PaperFlutedGlass.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperFlutedGlass from '~/components/ui/paper-fluted-glass/PaperFlutedGlass.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperFlutedGlass image=&quot;/flowers.webp&quot; :distortion=&quot;0.5&quot; shape=&quot;lines&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperFlutedGlass image="/flowers.webp" :distortion="0.5" shape="lines" />
    </div>
  </ComponentDemo>
</template>
