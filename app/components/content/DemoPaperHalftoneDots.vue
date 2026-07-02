<script setup lang="ts">
  import PaperHalftoneDots from '@registry/new-york/paper-halftone-dots/PaperHalftoneDots.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHalftoneDots from '~/components/ui/paper-halftone-dots/PaperHalftoneDots.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneDots
      :image=&quot;'/flowers.webp'&quot;
      :color-front=&quot;'#2b2b2b'&quot;
      :color-back=&quot;'#f2f1e8'&quot;
      :size=&quot;0.5&quot;
      :radius=&quot;1.25&quot;
      :contrast=&quot;0.4&quot;
      :grid=&quot;'hex'&quot;
      :type=&quot;'gooey'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperHalftoneDots
        image="/flowers.webp"
        color-front="#2b2b2b"
        color-back="#f2f1e8"
        :size="0.5"
        :radius="1.25"
        :contrast="0.4"
        grid="hex"
        type="gooey"
      />
    </div>
  </ComponentDemo>
</template>
