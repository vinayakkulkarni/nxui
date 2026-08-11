<script setup lang="ts">
  import TimezoneCompanion from '@registry/new-york/timezone-companion/TimezoneCompanion.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import TimezoneCompanion from '~/components/ui/timezone-companion/TimezoneCompanion.vue';
</script>

<template>
  <TimezoneCompanion />
</template>`"
  >
    <div class="relative size-full min-h-100">
      <div
        class="flex size-full items-center justify-center bg-zinc-200/60 p-6 dark:bg-zinc-950/40"
      >
        <TimezoneCompanion />
      </div>
    </div>
  </ComponentDemo>
</template>
