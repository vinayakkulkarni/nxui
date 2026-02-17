<script setup lang="ts">
  import Ballpit from '@registry/new-york/Ballpit/Ballpit.vue';
</script>

<template>
  <ComponentDemo :code="`<Ballpit :count='100' :colors='[0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24]' :follow-cursor='true' />`">
    <div class="relative h-[400px] w-full overflow-hidden rounded-lg">
      <Ballpit
        :count="100"
        :colors="[0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24]"
        :follow-cursor="true"
      />
    </div>
  </ComponentDemo>
</template>
