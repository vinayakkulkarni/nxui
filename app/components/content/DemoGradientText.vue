<script setup lang="ts">
  import GradientText from '@registry/new-york/GradientText/GradientText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GradientText from '~/components/ui/GradientText/GradientText.vue';
</script>

<template>
  <GradientText
    text=&quot;Gradient Text&quot;
    :colors=&quot;['#40ffaa', '#4079ff', '#40ffaa', '#4079ff', '#40ffaa']&quot;
    :speed=&quot;8&quot;
  />
</template>`"
  >
    <div class="flex h-50 w-full items-center justify-center">
      <GradientText text="Gradient Text" class="text-4xl font-bold" />
    </div>
  </ComponentDemo>
</template>
