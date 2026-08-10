<script setup lang="ts">
  const props = defineProps<{
    compact?: boolean;
  }>();

  const {
    isOpen,
    query,
    inputRef,
    selectedIndex,
    filteredGroups,
    flatItems,
    handleSelect,
    handleKeydown,
  } = useCommandMenu();
</script>

<template>
  <DocsCommandMenuTrigger :compact="props.compact" />

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm"
        @click="isOpen = false"
      ></div>
    </Transition>

    <Transition name="scale">
      <DocsCommandMenuDialog
        v-if="isOpen"
        :query="query"
        :filtered-groups="filteredGroups"
        :flat-items="flatItems"
        :selected-index="selectedIndex"
        :input-ref="inputRef"
        @update:query="query = $event"
        @update:input-ref="inputRef = $event"
        @select="handleSelect"
        @keydown="handleKeydown"
        @close="isOpen = false"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.12s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .scale-enter-active,
  .scale-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .scale-enter-from,
  .scale-leave-to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.96);
  }
  .scale-enter-to,
  .scale-leave-from {
    transform: translate(-50%, -50%) scale(1);
  }
</style>
