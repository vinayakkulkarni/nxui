<script setup lang="ts">
  import MeshGradient from '@registry/new-york/mesh-gradient/MeshGradient.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import MeshGradient from '~/components/ui/MeshGradient/MeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <MeshGradient
      :colors=&quot;['#e0eaff', '#241d9a', '#f75092', '#9f50d3']&quot;
      :speed=&quot;1&quot;
      :distortion=&quot;0.8&quot;
      :swirl=&quot;0.1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <MeshGradient
        :colors="['#e0eaff', '#241d9a', '#f75092', '#9f50d3']"
        :speed="1"
        :distortion="0.8"
        :swirl="0.1"
      />
    </div>
  </ComponentDemo>
</template>
