<script setup lang="ts">
  import GhostCursor from '@registry/new-york/GhostCursor/GhostCursor.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import GhostCursor from '~/components/ui/GhostCursor.vue';
</script>

<template>
  <GhostCursor color='#B19EEF' :trail-length='50' :bloom-strength='0.1' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <GhostCursor color="#B19EEF" :trail-length="50" :bloom-strength="0.1" />
    </div>
  </ComponentDemo>
</template>
