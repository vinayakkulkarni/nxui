<script setup lang="ts">
  defineProps<{
    isOpen: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm"
        @click="emit('close')"
      ></div>
    </Transition>

    <Transition name="slide-left">
      <div
        v-if="isOpen"
        class="fixed inset-y-0 left-0 z-100 w-75 bg-background border-r border-border shadow-2xl flex flex-col"
      >
        <div
          class="flex items-center justify-between p-4 border-b border-border"
        >
          <NuxtLink
            to="/docs"
            class="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground"
            @click="emit('close')"
          >
            <Icon name="lucide:component" class="size-5" />
            <span>NXUI</span>
          </NuxtLink>
          <button
            class="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Close Menu"
            @click="emit('close')"
          >
            <Icon name="lucide:x" class="size-5" />
          </button>
        </div>

        <DocsMobileNavPanelBody @close="emit('close')" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: transform 0.2s ease-out;
  }
  .slide-left-enter-from,
  .slide-left-leave-to {
    transform: translateX(-100%);
  }
</style>
