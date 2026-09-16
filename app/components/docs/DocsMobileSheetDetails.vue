<script setup lang="ts">
  import type { DocsMobileSheetProps } from '~/types/components';
  import Sheet from '~/components/ui/sheet/Sheet.vue';
  import SheetContent from '~/components/ui/sheet/SheetContent.vue';
  import SheetDescription from '~/components/ui/sheet/SheetDescription.vue';
  import SheetHeader from '~/components/ui/sheet/SheetHeader.vue';
  import SheetTitle from '~/components/ui/sheet/SheetTitle.vue';
  import SheetTrigger from '~/components/ui/sheet/SheetTrigger.vue';

  defineProps<DocsMobileSheetProps>();
  const route = useRoute();
  const detailsOpen = ref(false);

  watch(
    () => route.path,
    () => {
      detailsOpen.value = false;
    },
  );

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
</script>

<template>
  <Sheet v-model:open="detailsOpen">
    <SheetTrigger as-child>
      <button :class="detailsTriggerClass" aria-label="Open component details">
        <span :class="detailsLabelClass">Details</span>
        <span :class="detailsValueClass">
          <span :class="titleClass">{{ title }}</span>
          <Icon name="lucide:chevron-up" class="size-4 text-muted-foreground" />
        </span>
      </button>
    </SheetTrigger>
    <SheetContent side="bottom" :class="detailsSheetClass">
      <SheetHeader class="border-b border-border px-4 py-3 text-left">
        <SheetTitle :class="detailsTitleClass">{{ title }}</SheetTitle>
        <SheetDescription class="sr-only">
          Component details and source code
        </SheetDescription>
      </SheetHeader>
      <div :class="contentClass">
        <slot></slot>
      </div>
    </SheetContent>
  </Sheet>
</template>
