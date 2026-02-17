<script setup lang="ts">
  import DitherGradient from '@registry/new-york/DitherGradient/DitherGradient.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import DitherGradient from '~/components/ui/DitherGradient.vue';
</script>

<template>
  <DitherGradient class=&quot;h-[300px] w-full&quot; />
</template>`"
  >
    <div class="relative h-[300px] w-full">
      <DitherGradient class="absolute inset-0" />
      <div
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <p class="text-3xl font-bold text-white drop-shadow-lg">
          Dither Gradient
        </p>
      </div>
    </div>
  </ComponentDemo>
</template>
