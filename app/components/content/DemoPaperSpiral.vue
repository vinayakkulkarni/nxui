<script setup lang="ts">
  import PaperSpiral from '@registry/new-york/paper-spiral/PaperSpiral.vue';
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import PaperSpiral from '~/components/ui/paper-spiral/PaperSpiral.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <PaperSpiral
      :color-front=&quot;'#79D1FF'&quot;
      :color-back=&quot;'#001429'&quot;
      :density=&quot;0.7&quot;
      :stroke-width=&quot;0.6&quot;
      :speed=&quot;1&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <PaperSpiral
        :color-front="'#79D1FF'"
        :color-back="'#001429'"
        :density="0.7"
        :stroke-width="0.6"
        :speed="1"
      />
    </div>
  </ComponentDemo>
</template>
