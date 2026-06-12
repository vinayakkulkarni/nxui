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
  const navOpen = ref(false);
  const detailsOpen = ref(false);
  const closeSheets = () => {
    navOpen.value = false;
    detailsOpen.value = false;
  };
  watch(() => route.path, closeSheets);

  const barClass =
    'z-20 flex h-12 shrink-0 items-stretch border-t border-border bg-background shadow-sm lg:hidden';
  const barStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };
  const navTriggerClass =
    'm-1.5 inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted';
  const navTitleClass =
    'border-b border-border px-4 py-3 text-lg font-bold tracking-tight';
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
      <SheetContent side="left" class="w-72 overflow-y-auto p-0">
        <SheetTitle :class="navTitleClass">nxui</SheetTitle>
        <nav class="space-y-5 px-3 py-4">
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
