<script setup lang="ts">
  import PaperSimplexNoise from '@registry/new-york/paper-simplex-noise/PaperSimplexNoise.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSimplexNoise from '~/components/ui/paper-simplex-noise/PaperSimplexNoise.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSimplexNoise
      :colors=&quot;['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF']&quot;
      :steps-per-color=&quot;2&quot;
      :softness=&quot;0&quot;
      :scale=&quot;0.6&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSimplexNoise
        :colors="['#4449CF', '#FFD1E0', '#F94446', '#FFD36B', '#FFFFFF']"
        :steps-per-color="2"
        :softness="0"
        :scale="0.6"
        :speed="0.5"
      />
    </div>
  </ComponentDemo>
</template>
