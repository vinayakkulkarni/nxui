<script setup lang="ts">
  import { docsNav } from '~/config/docs';
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';

  const colorMode = useColorMode();
  const route = useRoute();
  const sidebarOpen = ref(false);

  // Close sidebar on navigation
  watch(
    () => route.path,
    () => {
      sidebarOpen.value = false;
    },
  );

  function toggleColorMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }

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
  <!-- Floating toolbar — top-left corner -->
  <div
    class="pointer-events-none absolute left-3 top-3 z-30 hidden items-center gap-1 lg:flex"
  >
    <!-- Sidebar trigger (Sheet) -->
    <Sheet v-model:open="sidebarOpen">
      <SheetTrigger as-child>
        <button
          class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          aria-label="Toggle navigation"
        >
          <Icon name="lucide:panel-left" class="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" class="w-72 p-0">
        <SheetTitle class="sr-only">Navigation</SheetTitle>
        <SheetDescription class="sr-only">
          Browse nxui components
        </SheetDescription>
        <div
          class="h-full overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50"
        >
          <nav class="space-y-5">
            <DocsSidebarGroup
              v-for="group in docsNav"
              :key="group.title"
              :title="group.title"
              :items="group.items"
              :active-href="activeHrefByGroup[group.title] ?? null"
            />
          </nav>
        </div>
      </SheetContent>
    </Sheet>

    <!-- GitHub link -->
    <a
      href="https://github.com/vinayakkulkarni/nxui"
      target="_blank"
      rel="noopener noreferrer"
      class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
    >
      <Icon name="simple-icons:github" class="size-4" />
      <span class="sr-only">GitHub</span>
    </a>

    <!-- Dark mode toggle -->
    <button
      class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
      aria-label="Toggle theme"
      @click="toggleColorMode"
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
  </div>
</template>
