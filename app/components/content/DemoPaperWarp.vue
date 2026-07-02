<script setup lang="ts">
  import PaperWarp from '@registry/new-york/paper-warp/PaperWarp.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperWarp from '~/components/ui/paper-warp/PaperWarp.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperWarp
      :colors=&quot;['#121212', '#9470ff', '#121212', '#8838ff']&quot;
      :shape=&quot;'edge'&quot;
      :distortion=&quot;0.3&quot;
      :swirl=&quot;0.9&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperWarp
        :colors="['#121212', '#9470ff', '#121212', '#8838ff']"
        :shape="'edge'"
        :distortion="0.3"
        :swirl="0.9"
      />
    </div>
  </ComponentDemo>
</template>
