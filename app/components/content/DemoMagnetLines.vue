<script setup lang="ts">
  import MagnetLines from '@registry/new-york/MagnetLines/MagnetLines.vue';
</script>

<template>
  <ComponentDemo
    full-width
    class="flex items-center justify-center"
    :code="`<script setup lang=&quot;ts&quot;>
  import MagnetLines from '~/components/ui/MagnetLines.vue';
</script>

<template>
  <MagnetLines :rows=&quot;9&quot; :columns=&quot;9&quot; container-size=&quot;60vmin&quot; />
</template>`"
  >
    <MagnetLines
      :rows="9"
      :columns="9"
      container-size="60vmin"
      line-color="currentColor"
      line-width="1vmin"
      line-height="6vmin"
      :base-angle="-10"
      class="text-foreground/30"
    />
  </ComponentDemo>
</template>
