<script setup lang="ts">
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';
  import type { RegistryItem } from '~/types/mcp';

  const route = useRoute();
  const open = ref(false);
  const item = ref<RegistryItem | null>(null);
  const errored = ref(false);

  const slug = computed(() => route.path.split('/').pop() ?? '');

  // Fetch the registry payload only when the sheet first opens; the JSON
  // carries every source file the CLI would install (up to ~1MB for shader
  // components), so it must never load eagerly on route entry.
  watch(open, async (val) => {
    if (!val || item.value || errored.value) return;
    try {
      item.value = await $fetch<RegistryItem>(`/r/${slug.value}.json`);
    } catch {
      errored.value = true;
    }
  });

  watch(
    () => route.path,
    () => {
      open.value = false;
      item.value = null;
      errored.value = false;
    },
  );
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <button
        class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        aria-label="View source code"
      >
        <Icon name="lucide:code-xml" class="size-4" />
      </button>
    </SheetTrigger>
    <SheetContent side="left" class="w-full max-w-full p-0 sm:max-w-xl">
      <SheetTitle class="sr-only">Source code</SheetTitle>
      <SheetDescription class="sr-only">
        Component source files from the nxui registry
      </SheetDescription>

      <div class="flex h-full min-h-0 flex-col">
        <div
          class="flex shrink-0 items-center gap-2 border-b border-border/50 px-4 py-3"
        >
          <Icon name="lucide:code-xml" class="size-4 text-muted-foreground" />
          <span class="font-mono text-sm text-foreground">Source Code</span>
        </div>

        <DocsSourceCodeViewer v-if="item?.files?.length" :files="item.files" />
        <div
          v-else-if="errored"
          class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
        >
          Source unavailable for this component.
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Icon name="lucide:loader-circle" class="size-4 animate-spin" />
          Loading source…
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
