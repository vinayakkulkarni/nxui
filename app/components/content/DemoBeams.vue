<script setup lang="ts">
  import Beams from '@registry/new-york/beams/Beams.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Beams from '~/components/ui/Beams.vue';
</script>

<template>
  <Beams :beam-width='2' :beam-height='15' :beam-number='12' light-color='#ffffff' :speed='2' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <Beams
        :beam-width="2"
        :beam-height="15"
        :beam-number="12"
        light-color="#ffffff"
        :speed="2"
      />
    </div>
  </ComponentDemo>
</template>
