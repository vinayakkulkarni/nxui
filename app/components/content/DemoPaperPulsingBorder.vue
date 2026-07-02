<script setup lang="ts">
  import PaperPulsingBorder from '@registry/new-york/paper-pulsing-border/PaperPulsingBorder.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperPulsingBorder from '~/components/ui/paper-pulsing-border/PaperPulsingBorder.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperPulsingBorder
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#0dc1fd', '#d915ef', '#ff3f2ecc']&quot;
      :roundness=&quot;0.25&quot;
      :thickness=&quot;0.1&quot;
      :softness=&quot;0.75&quot;
      :bloom=&quot;0.25&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperPulsingBorder
        :color-back="'#000000'"
        :colors="['#0dc1fd', '#d915ef', '#ff3f2ecc']"
        :roundness="0.25"
        :thickness="0.1"
        :softness="0.75"
        :bloom="0.25"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
