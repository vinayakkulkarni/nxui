<script setup lang="ts">
  import EvilEye from '@registry/new-york/evil-eye/EvilEye.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import EvilEye from '~/components/ui/EvilEye.vue';
</script>

<template>
  <EvilEye />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background dark:bg-black"
    >
      <ClientOnly><EvilEye /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
