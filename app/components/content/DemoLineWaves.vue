<script setup lang="ts">
  import LineWaves from '@registry/new-york/line-waves/LineWaves.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LineWaves from '~/components/ui/LineWaves.vue';
</script>

<template>
  <LineWaves :brightness=&quot;0.2&quot; :rotation=&quot;-45&quot; />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <ClientOnly><LineWaves /></ClientOnly>
    </div>
  </ComponentDemo>
</template>
