<script setup lang="ts">
  import SplashCursor from '@registry/new-york/SplashCursor/SplashCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import SplashCursor from '~/components/ui/SplashCursor.vue';
</script>

<template>
  <SplashCursor :splat-radius='0.2' :curl='3' :shading='true' />
</template>`"
  >
    <div
      class="relative h-[400px] w-full overflow-hidden rounded-lg bg-background"
      style="contain: paint"
    >
      <SplashCursor
        :splat-radius="0.2"
        :curl="3"
        :shading="true"
        class="!absolute !inset-0 !z-0 pointer-events-auto"
      />
    </div>
  </ComponentDemo>
</template>
