<script setup lang="ts">
  import PaperGemSmoke from '@registry/new-york/paper-gem-smoke/PaperGemSmoke.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGemSmoke from '~/components/ui/paper-gem-smoke/PaperGemSmoke.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGemSmoke
      :image=&quot;'/flowers.webp'&quot;
      :colors=&quot;['#333333', '#e7e6df']&quot;
      :color-back=&quot;'#f0efea'&quot;
      :color-inner=&quot;'#fafaf5'&quot;
      :inner-glow=&quot;1&quot;
      :outer-glow=&quot;0.55&quot;
      :shape=&quot;'diamond'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGemSmoke
        image="/flowers.webp"
        :colors="['#333333', '#e7e6df']"
        color-back="#f0efea"
        color-inner="#fafaf5"
        :inner-glow="1"
        :outer-glow="0.55"
        shape="diamond"
      />
    </div>
  </ComponentDemo>
</template>
