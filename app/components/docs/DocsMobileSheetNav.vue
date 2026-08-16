<script setup lang="ts">
  import { docsNav } from '~/config/docs';
  import type { DocsMobileSheetProps } from '~/types/components';
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';

  defineProps<DocsMobileSheetProps>();
  const route = useRoute();
  const colorMode = useColorMode();
  const navOpen = ref(false);

  function toggleColorMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }

  watch(
    () => route.path,
    () => {
      navOpen.value = false;
    },
  );

  const { activeHrefByGroup } = useDocsActiveNav();

  const navTriggerClass =
    'm-1.5 inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted';
  const footerStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };
  const footerIconClass =
    'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';
</script>

<template>
  <Sheet v-model:open="navOpen">
    <SheetTrigger as-child>
      <button :class="navTriggerClass" aria-label="Open navigation">
        <Icon name="lucide:panel-left" class="size-4" />
      </button>
    </SheetTrigger>
    <SheetContent side="left" class="flex w-72 flex-col gap-0 p-0">
      <div class="flex h-14 shrink-0 items-center border-b border-border px-4">
        <SheetTitle class="text-lg font-bold tracking-tight"> nxui </SheetTitle>
        <SheetDescription class="sr-only">
          Browse nxui components
        </SheetDescription>
      </div>
      <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <DocsSidebarGroup
          v-for="group in docsNav"
          :key="group.title"
          :title="group.title"
          :items="group.items"
          :active-href="activeHrefByGroup[group.title] ?? null"
        />
      </nav>
      <div
        :style="footerStyle"
        class="flex h-16 shrink-0 items-center gap-1 border-t border-border px-3"
      >
        <a
          href="https://github.com/vinayakkulkarni/nxui"
          target="_blank"
          rel="noopener noreferrer"
          :class="footerIconClass"
        >
          <Icon name="simple-icons:github" class="size-4" />
          <span class="sr-only">GitHub</span>
        </a>
        <button
          type="button"
          :class="footerIconClass"
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
    </SheetContent>
  </Sheet>
</template>
