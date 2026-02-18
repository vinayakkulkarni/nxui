<script setup lang="ts">
  import MetaBalls from '@registry/new-york/MetaBalls/MetaBalls.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import MetaBalls from '~/components/ui/MetaBalls.vue';
</script>

<template>
  <MetaBalls color='#ffffff' :speed='0.3' :ball-count='15' cursor-ball-color='#ffffff' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <MetaBalls
        color="#ffffff"
        :speed="0.3"
        :ball-count="15"
        cursor-ball-color="#ffffff"
      />
    </div>
  </ComponentDemo>
</template>
