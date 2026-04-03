<script setup lang="ts">
  import Ballpit from '@registry/new-york/ballpit/Ballpit.vue';
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Ballpit from '~/components/ui/Ballpit.vue';
</script>

<template>
  <Ballpit :count='100' :colors='[0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24]' :follow-cursor='true' />
</template>`"
  >
    <div class="relative h-100 w-full overflow-hidden rounded-lg bg-background">
      <Ballpit
        :count="100"
        :colors="[0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24]"
        :follow-cursor="true"
      />
    </div>
  </ComponentDemo>
</template>
