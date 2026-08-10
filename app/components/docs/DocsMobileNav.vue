<script setup lang="ts">
  const route = useRoute();
  const isOpen = ref(false);

  function handleClose() {
    isOpen.value = false;
  }

  if (import.meta.client) {
    const isLocked = useScrollLock(document.body);
    watch(isOpen, (val) => {
      isLocked.value = val;
    });
  }

  watch(
    () => route.path,
    () => handleClose(),
  );
</script>

<template>
  <div class="md:hidden">
    <button
      class="flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors"
      aria-label="Open Menu"
      @click="isOpen = true"
    >
      <Icon name="lucide:menu" class="size-5" />
    </button>

    <DocsMobileNavPanel :is-open="isOpen" @close="handleClose" />
  </div>
</template>
