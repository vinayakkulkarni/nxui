<script setup lang="ts">
  import ChaosButton from '@registry/new-york/chaos-button/ChaosButton.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ChaosButton from '~/components/ui/chaos-button/ChaosButton.vue';
</script>

<template>
  <ChaosButton label=&quot;Chaos Button&quot; />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-10 overflow-hidden bg-neutral-950 p-6"
    >
      <ChaosButton />
      <p class="text-sm text-neutral-400">Press and hold</p>
    </div>
  </ComponentDemo>
</template>
