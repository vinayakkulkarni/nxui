<script setup lang="ts">
  import PaperSwirl from '@registry/new-york/paper-swirl/PaperSwirl.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSwirl from '~/components/ui/paper-swirl/PaperSwirl.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSwirl
      :color-back=&quot;'#330000'&quot;
      :colors=&quot;['#ffd1d1', '#ff8a8a', '#660000']&quot;
      :band-count=&quot;4&quot;
      :twist=&quot;0.1&quot;
      :speed=&quot;0.32&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSwirl
        :color-back="'#330000'"
        :colors="['#ffd1d1', '#ff8a8a', '#660000']"
        :band-count="4"
        :twist="0.1"
        :speed="0.32"
      />
    </div>
  </ComponentDemo>
</template>
