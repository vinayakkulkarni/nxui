<script setup lang="ts">
  import GradientText from '@registry/new-york/gradient-text/GradientText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientText from '~/components/ui/GradientText/GradientText.vue';
</script>

<template>
  <GradientText
    :colors=&quot;['#5227FF', '#FF9FFC', '#B19EEF']&quot;
    :animation-speed=&quot;8&quot;
  >
    Gradient Text
  </GradientText>
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <GradientText class="text-4xl font-bold">Gradient Text</GradientText>
    </div>
  </ComponentDemo>
</template>
