<script setup lang="ts">
  import Lightning from '@registry/new-york/Lightning/Lightning.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Lightning from '~/components/ui/Lightning/Lightning.vue';
</script>

<template>
  <div class=&quot;relative h-[400px] w-full overflow-hidden rounded-lg&quot;>
    <Lightning :hue=&quot;230&quot; :speed=&quot;1&quot; :intensity=&quot;1&quot; :size=&quot;1&quot; />
  </div>
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <Lightning :hue="230" :speed="1" :intensity="1" :size="1" />
    </div>
  </ComponentDemo>
</template>
