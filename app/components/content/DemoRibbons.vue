<script setup lang="ts">
  import Ribbons from '@registry/new-york/Ribbons/Ribbons.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Ribbons :colors='[&quot;#FC8EAC&quot;, &quot;#A855F7&quot;, &quot;#3B82F6&quot;]' :base-thickness='30' :base-spring='0.03' />`"
  >
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg bg-black">
      <Ribbons
        :colors="['#FC8EAC', '#A855F7', '#3B82F6']"
        :base-thickness="30"
        :base-spring="0.03"
      />
    </div>
  </ComponentDemo>
</template>
