<script setup lang="ts">
  import PaperSmokeRing from '@registry/new-york/paper-smoke-ring/PaperSmokeRing.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSmokeRing from '~/components/ui/paper-smoke-ring/PaperSmokeRing.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSmokeRing
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#ffffff', '#ffca0a', '#fc6203', '#fc620366']&quot;
      :noise-scale=&quot;2&quot;
      :radius=&quot;0.4&quot;
      :thickness=&quot;0.8&quot;
      :inner-shape=&quot;4&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSmokeRing
        :color-back="'#000000'"
        :colors="['#ffffff', '#ffca0a', '#fc6203', '#fc620366']"
        :noise-scale="2"
        :radius="0.4"
        :thickness="0.8"
        :inner-shape="4"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
