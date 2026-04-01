<script setup lang="ts">
  import Plasma from '@registry/new-york/Plasma/Plasma.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import Plasma from '~/components/ui/Plasma/Plasma.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <Plasma color=&quot;#4f46e5&quot; :speed=&quot;1&quot; direction=&quot;forward&quot; />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Plasma color="#4f46e5" :speed="1" direction="forward" />
    </div>
  </ComponentDemo>
</template>
