<script setup lang="ts">
  import AnimatedContent from '@registry/new-york/AnimatedContent/AnimatedContent.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AnimatedContent from '~/components/ui/AnimatedContent.vue';
</script>

<template>
  <AnimatedContent :distance='100' direction='vertical' :duration='0.8'>
    <p class='text-2xl font-bold'>Scroll to reveal this content</p>
  </AnimatedContent>
</template>`"
  >
    <div class="flex h-[200px] w-full items-center justify-center">
      <AnimatedContent :distance="100" direction="vertical" :duration="0.8">
        <p class="text-2xl font-bold text-foreground">
          Scroll to reveal this content
        </p>
      </AnimatedContent>
    </div>
  </ComponentDemo>
</template>
