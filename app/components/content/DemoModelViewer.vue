<script setup lang="ts">
  import ModelViewer from '@registry/new-york/ModelViewer/ModelViewer.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ModelViewer from '~/components/ui/ModelViewer.vue';
</script>

<template>
  <ModelViewer url='/models/your-model.glb' :auto-rotate='true' :fade-in='true' />
</template>`"
  >
    <div
      class="flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg bg-background"
    >
      <ModelViewer
        url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb"
        :auto-rotate="true"
        :fade-in="true"
        :auto-frame="true"
        background-color=""
      />
    </div>
  </ComponentDemo>
</template>
