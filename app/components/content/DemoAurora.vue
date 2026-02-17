<script setup lang="ts">
  import Aurora from '@registry/new-york/Aurora/Aurora.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Aurora from '~/components/ui/Aurora/Aurora.vue';
</script>

<template>
  <div class=&quot;relative h-[400px] w-full overflow-hidden rounded-lg bg-black&quot;>
    <Aurora
      :color-stops=&quot;['#5227FF', '#7cff67', '#5227FF']&quot;
      :amplitude=&quot;1.0&quot;
      :blend=&quot;0.5&quot;
      :speed=&quot;1.0&quot;
    />
  </div>
</template>`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <Aurora
        :color-stops="['#5227FF', '#7cff67', '#5227FF']"
        :amplitude="1.0"
        :blend="0.5"
        :speed="1.0"
      />
    </div>
  </ComponentDemo>
</template>
