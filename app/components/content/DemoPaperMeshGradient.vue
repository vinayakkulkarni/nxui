<script setup lang="ts">
  import PaperMeshGradient from '@registry/new-york/paper-mesh-gradient/PaperMeshGradient.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperMeshGradient from '~/components/ui/paper-mesh-gradient/PaperMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMeshGradient
      :colors=&quot;['#e0eaff', '#241d9a', '#f75092', '#9f50d3']&quot;
      :distortion=&quot;0.8&quot;
      :swirl=&quot;0.1&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperMeshGradient
        :colors="['#e0eaff', '#241d9a', '#f75092', '#9f50d3']"
        :distortion="0.8"
        :swirl="0.1"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
