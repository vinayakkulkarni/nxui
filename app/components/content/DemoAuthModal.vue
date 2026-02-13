<script setup lang="ts">
  import AuthModal from '@registry/new-york/AuthModal/AuthModal.vue';

  const open = ref(false);
</script>

<template>
  <ComponentDemo>
    <button
      class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      @click="open = true"
    >
      Open Auth Modal
    </button>
    <AuthModal v-model:open="open" />
  </ComponentDemo>
</template>
