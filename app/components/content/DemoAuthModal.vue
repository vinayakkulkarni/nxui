<script setup lang="ts">
  import AuthModal from '@registry/new-york/AuthModal/AuthModal.vue';

  const open = ref(false);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AuthModal from '~/components/ui/AuthModal.vue';

  const open = ref(false);
</script>

<template>
  <button @click=&quot;open = true&quot;>Open Auth Modal</button>
  <AuthModal v-model:open=&quot;open&quot; />
</template>`"
  >
    <button
      class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      @click="open = true"
    >
      Open Auth Modal
    </button>
    <AuthModal v-model:open="open" />
  </ComponentDemo>
</template>
