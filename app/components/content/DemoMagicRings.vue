<script setup lang="ts">
  import MagicRings from '@registry/new-york/magic-rings/MagicRings.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MagicRings from '~/components/ui/MagicRings.vue';
</script>

<template>
  <MagicRings :follow-mouse='true' />
</template>`"
  >
    <div
      class="h-100 w-full overflow-hidden rounded-lg bg-background dark:bg-black"
    >
      <ClientOnly><MagicRings :follow-mouse="true" /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
