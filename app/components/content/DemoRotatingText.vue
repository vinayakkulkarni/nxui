<script setup lang="ts">
  import RotatingText from '@registry/new-york/RotatingText/RotatingText.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import RotatingText from '~/components/ui/RotatingText/RotatingText.vue';
</script>

<template>
  <RotatingText
    :texts=&quot;['Creative', 'Dynamic', 'Animated', 'Beautiful']&quot;
    :rotation-interval=&quot;2000&quot;
  />
</template>`"
  >
    <div
      class="flex h-[200px] w-full items-center justify-center gap-2 text-4xl font-bold"
    >
      <span>Make it</span>
      <RotatingText
        :texts="['Creative', 'Dynamic', 'Animated', 'Beautiful']"
        :rotation-interval="2000"
        class="text-primary"
      />
    </div>
  </ComponentDemo>
</template>
