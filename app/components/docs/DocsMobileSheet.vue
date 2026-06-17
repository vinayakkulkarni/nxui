<script setup lang="ts">
  import { docsNav } from '~/config/docs';
  import type { DocsMobileSheetProps } from '~/types/components';
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetHeader from '~/components/ui/sheet/SheetHeader.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';

  defineProps<DocsMobileSheetProps>();
  const route = useRoute();
  const colorMode = useColorMode();
  const navOpen = ref(false);
  const detailsOpen = ref(false);

  function toggleColorMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }
  const closeSheets = () => {
    navOpen.value = false;
    detailsOpen.value = false;
  };
  watch(() => route.path, closeSheets);

  const barClass =
    'z-20 flex h-12 shrink-0 items-stretch border-t border-border bg-background shadow-sm lg:hidden';
  const barStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };
  const footerStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };
  const footerIconClass =
    'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';
  const navTriggerClass =
    'm-1.5 inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted';
  const detailsTriggerClass =
    'flex flex-1 items-center justify-between gap-3 px-3 text-left transition-colors hover:bg-muted';
  const detailsLabelClass =
    'font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground';
  const detailsValueClass =
    'flex flex-1 items-center justify-end gap-2 overflow-hidden';
  const detailsSheetClass =
    'max-h-[85dvh] overflow-y-auto rounded-t-md border-t border-border bg-background p-0 lg:hidden';
  const detailsTitleClass = 'text-xl font-extrabold tracking-tight';
  const titleClass = 'truncate text-sm font-medium text-foreground';
  const contentClass = 'px-4 pb-6 pt-4';
  const detailsDescription = 'Component details and source code';
</script>

<template>
  <div :class="barClass" :style="barStyle">
    <Sheet v-model:open="navOpen">
      <SheetTrigger as-child>
        <button :class="navTriggerClass" aria-label="Open navigation">
          <Icon name="lucide:panel-left" class="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" class="flex w-72 flex-col gap-0 p-0">
        <!-- Header: title only. SheetContent renders the close (X) at top-4
             right-4; the title is left-aligned so they never collide. -->
        <div
          class="flex h-14 shrink-0 items-center border-b border-border px-4"
        >
          <SheetTitle class="text-lg font-bold tracking-tight">
            nxui
          </SheetTitle>
          <SheetDescription class="sr-only">
            Browse nxui components
          </SheetDescription>
        </div>
        <!-- Scrollable nav -->
        <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <DocsSidebarGroup
            v-for="group in docsNav"
            :key="group.title"
            :title="group.title"
            :items="group.items"
            :active-href="
              group.items.find((item) => route.path === item.path)?.path ?? null
            "
          />
        </nav>
        <!-- Sticky footer: GitHub + theme toggle (mirrors mapcn-vue) -->
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
                :name="
                  colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'
                "
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

    <Sheet v-model:open="detailsOpen">
      <SheetTrigger as-child>
        <button
          :class="detailsTriggerClass"
          aria-label="Open component details"
        >
          <span :class="detailsLabelClass">Details</span>
          <span :class="detailsValueClass">
            <span :class="titleClass">{{ title }}</span>
            <Icon
              name="lucide:chevron-up"
              class="size-4 text-muted-foreground"
            />
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" :class="detailsSheetClass">
        <SheetHeader class="border-b border-border px-4 py-3 text-left">
          <SheetTitle :class="detailsTitleClass">{{ title }}</SheetTitle>
          <SheetDescription class="sr-only">{{
            detailsDescription
          }}</SheetDescription>
        </SheetHeader>
        <div :class="contentClass">
          <slot></slot>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
