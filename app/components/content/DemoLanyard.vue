<script setup lang="ts">
  import Lanyard from '@registry/new-york/Lanyard/Lanyard.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Lanyard from '~/components/ui/Lanyard.vue';
</script>

<template>
  <Lanyard :gravity='-40' :fov='20' band-color='#B19EEF' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <Lanyard :gravity="-40" :fov="20" band-color="#B19EEF" />
    </div>
  </ComponentDemo>
</template>
