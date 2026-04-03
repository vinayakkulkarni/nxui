<script setup lang="ts">
  import Noise from '@registry/new-york/noise/Noise.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Noise from '~/components/ui/Noise.vue';
</script>

<template>
  <div class=&quot;relative h-64 w-full&quot;>
    <p class=&quot;p-8 text-lg&quot;>Content with noise overlay</p>
    <Noise :pattern-alpha=&quot;15&quot; :pattern-refresh-interval=&quot;2&quot; />
  </div>
</template>`"
  >
    <div
      class="relative flex h-75 w-full items-center justify-center overflow-hidden rounded-lg bg-background"
    >
      <p class="text-2xl font-semibold text-foreground">Noise Overlay Effect</p>
      <ClientOnly>
        <Noise :pattern-alpha="15" :pattern-refresh-interval="2" />
      </ClientOnly>
    </div>
  </ComponentDemo>
</template>
