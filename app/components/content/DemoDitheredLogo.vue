<script setup lang="ts">
  import DitheredLogo from '@registry/new-york/dithered-logo/DitheredLogo.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DitheredLogo from '~/components/ui/dithered-logo/DitheredLogo.vue';
</script>

<template>
  <DitheredLogo
    image-src=&quot;/images/logo.svg&quot;
    :grid-size=&quot;200&quot;
    :scale=&quot;0.5&quot;
    :blur=&quot;3.75&quot;
    :threshold=&quot;180&quot;
    class=&quot;size-72&quot;
  />
  <!-- Hover to repel particles, click for ripples -->
</template>`"
  >
    <div class="flex w-full items-center justify-center p-4 sm:p-8">
      <DitheredLogo
        image-src="/images/dithered-logo/logo.svg"
        class="size-60 sm:size-80"
      />
    </div>
  </ComponentDemo>
</template>
