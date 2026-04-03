<script setup lang="ts">
  import AnimatedContent from '@registry/new-york/animated-content/AnimatedContent.vue';
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
    <div class="h-75 w-full overflow-y-auto rounded-lg">
      <div class="flex h-150 items-end justify-center pb-12">
        <AnimatedContent :distance="100" direction="vertical" :duration="0.8">
          <p class="text-2xl font-bold text-foreground">
            Scroll down to reveal this content
          </p>
        </AnimatedContent>
      </div>
    </div>
  </ComponentDemo>
</template>
