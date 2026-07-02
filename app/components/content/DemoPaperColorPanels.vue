<script setup lang="ts">
  import PaperColorPanels from '@registry/new-york/paper-color-panels/PaperColorPanels.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperColorPanels from '~/components/ui/paper-color-panels/PaperColorPanels.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperColorPanels
      :colors=&quot;['#ff9d00', '#fd4f30', '#809bff', '#6d2eff', '#333aff', '#f15cff', '#ffd557']&quot;
      :color-back=&quot;'#000000'&quot;
      :length=&quot;1.1&quot;
      :density=&quot;3&quot;
      :speed=&quot;0.5&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperColorPanels
        :colors="[
          '#ff9d00',
          '#fd4f30',
          '#809bff',
          '#6d2eff',
          '#333aff',
          '#f15cff',
          '#ffd557',
        ]"
        :color-back="'#000000'"
        :length="1.1"
        :density="3"
        :speed="0.5"
      />
    </div>
  </ComponentDemo>
</template>
