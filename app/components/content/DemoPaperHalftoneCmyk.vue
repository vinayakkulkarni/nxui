<script setup lang="ts">
  import PaperHalftoneCmyk from '@registry/new-york/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperHalftoneCmyk from '~/components/ui/paper-halftone-cmyk/PaperHalftoneCmyk.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperHalftoneCmyk
      :image=&quot;'/flowers.webp'&quot;
      :size=&quot;0.2&quot;
      :contrast=&quot;1&quot;
      :softness=&quot;1&quot;
      :type=&quot;'ink'&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperHalftoneCmyk
        image="/flowers.webp"
        :size="0.2"
        :contrast="1"
        :softness="1"
        type="ink"
      />
    </div>
  </ComponentDemo>
</template>
