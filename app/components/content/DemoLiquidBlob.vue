<script setup lang="ts">
  import LiquidBlob from '@registry/new-york/LiquidBlob/LiquidBlob.vue';
</script>

<template>
  <ComponentDemo
    full-width
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidBlob from '~/components/ui/LiquidBlob.vue';
</script>

<template>
  <LiquidBlob class=&quot;h-[300px] w-full rounded-xl bg-neutral-100 dark:bg-zinc-900&quot; />
</template>`"
  >
    <LiquidBlob
      class="h-[300px] w-full rounded-xl bg-neutral-100 dark:bg-zinc-900"
    >
      <div class="flex h-full items-center justify-center">
        <p class="text-lg font-medium text-foreground/80">Move your cursor</p>
      </div>
    </LiquidBlob>
  </ComponentDemo>
</template>
