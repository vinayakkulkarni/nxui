<script setup lang="ts">
  import PaperGrainGradient from '@registry/new-york/paper-grain-gradient/PaperGrainGradient.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperGrainGradient from '~/components/ui/paper-grain-gradient/PaperGrainGradient.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperGrainGradient
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#7300ff', '#eba8ff', '#00bfff', '#2a00ff']&quot;
      :softness=&quot;0.5&quot;
      :intensity=&quot;0.5&quot;
      :noise=&quot;0.25&quot;
      :shape=&quot;'corners'&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperGrainGradient
        :color-back="'#000000'"
        :colors="['#7300ff', '#eba8ff', '#00bfff', '#2a00ff']"
        :softness="0.5"
        :intensity="0.5"
        :noise="0.25"
        :shape="'corners'"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
