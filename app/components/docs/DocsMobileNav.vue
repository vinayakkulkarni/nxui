<script setup lang="ts">
  import { docsNav } from '~/config/docs';

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

  const activeHrefByGroup = computed(() => {
    const result: Record<string, string | null> = {};
    for (const group of docsNav) {
      const activeItem = group.items.find((item) => route.path === item.path);
      result[group.title] = activeItem?.path ?? null;
    }
    return result;
  });
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

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          @click="handleClose"
        ></div>
      </Transition>

      <Transition name="slide-left">
        <div
          v-if="isOpen"
          class="fixed inset-y-0 left-0 z-[100] w-[300px] bg-background border-r border-border shadow-2xl flex flex-col"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-border"
          >
            <NuxtLink
              to="/docs"
              class="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground"
              @click="handleClose"
            >
              <Icon name="lucide:component" class="size-5" />
              <span>NXUI</span>
            </NuxtLink>
            <button
              class="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Close Menu"
              @click="handleClose"
            >
              <Icon name="lucide:x" class="size-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <nav class="space-y-8">
              <DocsMobileNavGroup
                v-for="group in docsNav"
                :key="group.title"
                :title="group.title"
                :items="group.items"
                :active-href="activeHrefByGroup[group.title] ?? null"
                @close="handleClose"
              />
              <div class="pt-4 border-t border-border">
                <NuxtLink
                  to="https://github.com/vinayakkulkarni/nxui"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </NuxtLink>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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
