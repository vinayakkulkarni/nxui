<script setup lang="ts">
  import PrismGradient from '@registry/new-york/prism-gradient/PrismGradient.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PrismGradient from '~/components/ui/prism-gradient/PrismGradient.vue';
</script>

<template>
  <section class=&quot;relative min-h-screen&quot;>
    <PrismGradient :speed=&quot;1&quot; :noise=&quot;{ opacity: 0.5 }&quot; />
    <div class=&quot;relative z-10&quot;>
      <!-- hero content -->
    </div>
  </section>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <PrismGradient :speed="1" :noise="{ opacity: 0.5 }" />
      <div
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        <p
          class="text-center text-3xl font-semibold tracking-tight text-white mix-blend-difference sm:text-5xl"
        >
          Prism Gradient
        </p>
      </div>
    </div>
  </ComponentDemo>
</template>
