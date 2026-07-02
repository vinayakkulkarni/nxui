<script setup lang="ts">
  import PaperStaticRadialGradient from '@registry/new-york/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperStaticRadialGradient from '~/components/ui/paper-static-radial-gradient/PaperStaticRadialGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperStaticRadialGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#00bbff', '#00ffe1', '#ffffff']&quot;
      :radius=&quot;0.8&quot;
      :focal-distance=&quot;0.99&quot;
      :falloff=&quot;0.24&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperStaticRadialGradient
        :color-back="'#000000'"
        :colors="['#00bbff', '#00ffe1', '#ffffff']"
        :radius="0.8"
        :focal-distance="0.99"
        :falloff="0.24"
      />
    </div>
  </ComponentDemo>
</template>
