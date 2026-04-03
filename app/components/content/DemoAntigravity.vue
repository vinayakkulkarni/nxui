<script setup lang="ts">
  import Antigravity from '@registry/new-york/antigravity/Antigravity.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Antigravity from '~/components/ui/Antigravity.vue';
</script>

<template>
  <Antigravity :count='300' color='#FF9FFC' particle-shape='capsule' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg">
      <Antigravity :count="300" color="#FF9FFC" particle-shape="capsule" />
    </div>
  </ComponentDemo>
</template>
