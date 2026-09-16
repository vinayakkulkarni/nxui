<script setup lang="ts">
  import Orb from '@registry/new-york/orb/Orb.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Orb from '~/components/ui/Orb.vue';
</script>

<template>
  <Orb :hue='0' :hover-intensity='0.2' :rotate-on-hover='true' />
</template>`"
  >
    <div
      class="relative size-full min-h-80 overflow-hidden rounded-lg bg-background"
    >
      <Orb
        class="absolute inset-0 size-full"
        :hue="0"
        :hover-intensity="0.2"
        :rotate-on-hover="true"
      />
    </div>
  </ComponentDemo>
</template>
