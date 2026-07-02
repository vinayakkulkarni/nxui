<script setup lang="ts">
  import PaperMetaballs from '@registry/new-york/paper-metaballs/PaperMetaballs.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperMetaballs from '~/components/ui/paper-metaballs/PaperMetaballs.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperMetaballs
      :color-back=&quot;'#000000'&quot;
      :colors=&quot;['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff']&quot;
      :count=&quot;10&quot;
      :size=&quot;0.83&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperMetaballs
        :color-back="'#000000'"
        :colors="['#6e33cc', '#ff5500', '#ffc105', '#ffc800', '#f585ff']"
        :count="10"
        :size="0.83"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
