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
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <Orb :hue="0" :hover-intensity="0.2" :rotate-on-hover="true" />
    </div>
  </ComponentDemo>
</template>
