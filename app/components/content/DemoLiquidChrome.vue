<script setup lang="ts">
  import LiquidChrome from '@registry/new-york/LiquidChrome/LiquidChrome.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import LiquidChrome from '~/components/ui/LiquidChrome/LiquidChrome.vue';
</script>

<template>
  <div class=&quot;relative h-100 w-full overflow-hidden rounded-lg&quot;>
    <LiquidChrome
      :base-color=&quot;[0.1, 0.1, 0.1]&quot;
      :speed=&quot;0.2&quot;
      :amplitude=&quot;0.3&quot;
      :frequency-x=&quot;3&quot;
      :frequency-y=&quot;3&quot;
      interactive
    />
  </div>
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <LiquidChrome
        :base-color="[0.1, 0.1, 0.1]"
        :speed="0.2"
        :amplitude="0.3"
        :frequency-x="3"
        :frequency-y="3"
        interactive
      />
    </div>
  </ComponentDemo>
</template>
