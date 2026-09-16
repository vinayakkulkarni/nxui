<script setup lang="ts">
  import { docsNav } from '~/config/docs';
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';
  import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
  import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
  import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

  const route = useRoute();
  const sidebarOpen = ref(false);

  watch(
    () => route.path,
    () => {
      sidebarOpen.value = false;
    },
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
  <Sheet v-model:open="sidebarOpen">
    <Tooltip>
      <TooltipTrigger as-child>
        <SheetTrigger as-child>
          <button
            class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            aria-label="Toggle navigation"
          >
            <Icon name="lucide:panel-left" class="size-4" />
          </button>
        </SheetTrigger>
      </TooltipTrigger>
      <TooltipContent>Navigation</TooltipContent>
    </Tooltip>
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
</template>
