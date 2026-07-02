<script setup lang="ts">
  import PaperStaticMeshGradient from '@registry/new-york/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticMeshGradient from '~/components/ui/paper-static-mesh-gradient/PaperStaticMeshGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticMeshGradient
      :colors=&quot;['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd']&quot;
      :positions=&quot;2&quot;
      :wave-x=&quot;1.0&quot;
      :wave-y=&quot;1.0&quot;
      :mixing=&quot;0.93&quot;
      :rotation=&quot;270&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperStaticMeshGradient
        :colors="['#ffad0a', '#6200ff', '#e2a3ff', '#ff99fd']"
        :positions="2"
        :wave-x="1.0"
        :wave-y="1.0"
        :mixing="0.93"
        :rotation="270"
      />
    </div>
  </ComponentDemo>
</template>
