<script setup lang="ts">
  import ColorBends from '@registry/new-york/ColorBends/ColorBends.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import ColorBends from '~/components/ui/ColorBends.vue';
</script>

<template>
  <ColorBends :rotation='45' :speed='0.2' :colors='[&quot;#FF9FFC&quot;, &quot;#5227FF&quot;]' :warp-strength='1' />
</template>`"
  >
    <div
      class="relative h-[400px] w-full overflow-hidden rounded-lg bg-background"
    >
      <ColorBends
        :rotation="45"
        :speed="0.2"
        :colors="['#FF9FFC', '#5227FF']"
        :warp-strength="1"
      />
    </div>
  </ComponentDemo>
</template>
