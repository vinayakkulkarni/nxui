<script setup lang="ts">
  import AnimatedContent from '@registry/new-york/AnimatedContent/AnimatedContent.vue';
</script>

<template>
  <ComponentDemo :code="`<AnimatedContent :distance='100' direction='vertical' :duration='0.8' />`">
    <div class="flex h-[200px] w-full items-center justify-center">
      <AnimatedContent :distance="100" direction="vertical" :duration="0.8">
        <p class="text-2xl font-bold text-foreground">Scroll to reveal this content</p>
      </AnimatedContent>
    </div>
  </ComponentDemo>
</template>
