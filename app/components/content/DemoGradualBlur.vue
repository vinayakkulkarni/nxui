<script setup lang="ts">
  import GradualBlur from '@registry/new-york/GradualBlur/GradualBlur.vue';
</script>

<template>
  <ComponentDemo :code="`<GradualBlur position='bottom' :strength='2' height='6rem' :div-count='5' />`">
    <div class="relative h-[300px] w-full overflow-hidden rounded-lg">
      <div class="size-full bg-gradient-to-b from-blue-500 to-purple-600 p-8">
        <p class="text-white text-lg">Content with a gradual blur overlay at the bottom.</p>
        <p class="text-white/80 mt-4">This creates a smooth fade effect using layered backdrop filters.</p>
      </div>
      <GradualBlur position="bottom" :strength="2" height="6rem" :div-count="5" />
    </div>
  </ComponentDemo>
</template>
