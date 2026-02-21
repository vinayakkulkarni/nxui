<script setup lang="ts">
  import Galaxy from '@registry/new-york/Galaxy/Galaxy.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Galaxy from '~/components/ui/Galaxy.vue';
</script>

<template>
  <Galaxy :star-count='2000' :speed='0.5' :star-size='2' star-color='#ffffff' />
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <Galaxy
        :star-count="2000"
        :speed="0.5"
        :star-size="2"
        star-color="#ffffff"
      />
    </div>
  </ComponentDemo>
</template>
