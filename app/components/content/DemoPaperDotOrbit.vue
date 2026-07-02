<script setup lang="ts">
  import PaperDotOrbit from '@registry/new-york/paper-dot-orbit/PaperDotOrbit.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperDotOrbit from '~/components/ui/paper-dot-orbit/PaperDotOrbit.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperDotOrbit
      :colors=&quot;['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000']&quot;
      :color-back=&quot;'#000000'&quot;
      :size=&quot;1&quot;
      :spread=&quot;1&quot;
      :steps-per-color=&quot;4&quot;
      :speed=&quot;1.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperDotOrbit
        :colors="['#ffc96b', '#ff6200', '#ff2f00', '#421100', '#1a0000']"
        :color-back="'#000000'"
        :size="1"
        :spreading="1"
        :steps-per-color="4"
        :speed="1.5"
      />
    </div>
  </ComponentDemo>
</template>
