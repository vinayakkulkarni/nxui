<script setup lang="ts">
  import PaperDithering from '@registry/new-york/paper-dithering/PaperDithering.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDithering from '~/components/ui/paper-dithering/PaperDithering.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDithering
      :color-back=&quot;'#000000'&quot;
      :color-front=&quot;'#00b2ff'&quot;
      :shape=&quot;'sphere'&quot;
      :type=&quot;'4x4'&quot;
      :size=&quot;2&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDithering
        :color-back="'#000000'"
        :color-front="'#00b2ff'"
        :shape="'sphere'"
        :type="'4x4'"
        :size="2"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
