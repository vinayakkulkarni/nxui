<script setup lang="ts">
  import StickyScrollCards from '@registry/new-york/sticky-scroll-cards/StickyScrollCards.vue';
</script>

<template>
  <ComponentDemo
    class="p-0"
    :code="`<script setup lang=&quot;ts&quot;>
  import StickyScrollCards from '~/components/ui/StickyScrollCards.vue';
</script>

<template>
  &lt;!-- Wrap in a tall scroll container so the sticky stack pins as you scroll --&gt;
  <div class=&quot;h-screen overflow-y-auto&quot;>
    <StickyScrollCards />
  </div>
</template>`"
  >
    <div class="relative size-full overflow-y-auto rounded-lg">
      <StickyScrollCards />
    </div>
  </ComponentDemo>
</template>
