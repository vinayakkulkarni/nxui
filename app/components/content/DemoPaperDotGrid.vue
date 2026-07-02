<script setup lang="ts">
  import PaperDotGrid from '@registry/new-york/paper-dot-grid/PaperDotGrid.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotGrid from '~/components/ui/paper-dot-grid/PaperDotGrid.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotGrid
      :color-back=&quot;'#000000'&quot;
      :color-fill=&quot;'#ffffff'&quot;
      :color-stroke=&quot;'#ffaa00'&quot;
      :size=&quot;2&quot;
      :gap-x=&quot;32&quot;
      :gap-y=&quot;32&quot;
      :shape=&quot;'circle'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDotGrid
        :color-back="'#000000'"
        :color-fill="'#ffffff'"
        :color-stroke="'#ffaa00'"
        :size="2"
        :gap-x="32"
        :gap-y="32"
        :shape="'circle'"
      />
    </div>
  </ComponentDemo>
</template>
