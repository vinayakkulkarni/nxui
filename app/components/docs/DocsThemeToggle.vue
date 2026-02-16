<script setup lang="ts">
const colorMode = useColorMode();

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <button
    class="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground dark:bg-white/[0.05] dark:hover:bg-white/[0.1]"
    aria-label="Toggle theme"
    @click="toggle"
  >
    <Icon
      :name="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'"
      class="size-4"
    />
  </button>
</template>
