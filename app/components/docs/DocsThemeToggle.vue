<script setup lang="ts">
  const colorMode = useColorMode();

  function toggle() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }
</script>

<template>
  <button
    class="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10"
    aria-label="Toggle theme"
    @click="toggle"
  >
    <ClientOnly>
      <Icon
        :name="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'"
        class="size-4"
      />
      <template #fallback>
        <Icon name="lucide:moon" class="size-4" />
      </template>
    </ClientOnly>
  </button>
</template>
