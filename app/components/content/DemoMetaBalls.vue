<script setup lang="ts">
  import MetaBalls from '@registry/new-york/meta-balls/MetaBalls.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MetaBalls from '~/components/ui/MetaBalls.vue';
</script>

<template>
  <MetaBalls color='#ffffff' :speed='0.3' :ball-count='15' cursor-ball-color='#ffffff' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <MetaBalls
        class="absolute inset-0 size-full"
        color="#ffffff"
        :speed="0.3"
        :ball-count="15"
        cursor-ball-color="#ffffff"
      />
    </div>
  </ComponentDemo>
</template>
