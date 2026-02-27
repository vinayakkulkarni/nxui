<script setup lang="ts">
  import MatrixRain from '@registry/new-york/MatrixRain/MatrixRain.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import MatrixRain from '~/components/ui/MatrixRain.vue';
</script>

<template>
  <div class=&quot;relative h-[400px] w-full bg-background&quot;>
    <MatrixRain class=&quot;absolute inset-0&quot; />
  </div>
</template>`"
  >
    <div class="relative min-h-[400px] w-full bg-background">
      <MatrixRain class="absolute inset-0" />
      <div
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <p
          class="text-5xl font-black tracking-[0.3em] text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]"
        >
          MATRIX
        </p>
      </div>
    </div>
  </ComponentDemo>
</template>
