<script setup lang="ts">
  import Folder from '@registry/new-york/Folder/Folder.vue';
</script>

<template>
  <ComponentDemo
    :code="`<Folder color='#5227FF' :size='1' :items='[&quot;Doc 1&quot;, &quot;Doc 2&quot;, &quot;Doc 3&quot;]' />`"
  >
    <div class="flex h-[300px] w-full items-center justify-center rounded-lg">
      <Folder color="#5227FF" :size="1.5" :items="['Doc 1', 'Doc 2', 'Doc 3']" />
    </div>
  </ComponentDemo>
</template>
