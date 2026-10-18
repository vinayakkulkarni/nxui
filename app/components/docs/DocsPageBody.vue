<script setup lang="ts">
  import type { MinimarkNode } from '@nuxt/content';
  import type { DocsPageBodyProps } from '~/types/docs';

  const props = defineProps<DocsPageBodyProps>();
  const body = useDocsBodySections(() => props.nodes);

  // Usage is the section people open first, so it starts expanded.
  const OPEN_BY_DEFAULT = new Set(['usage']);

  function asDoc(nodes: MinimarkNode[]) {
    return {
      body: { type: 'minimark' as const, value: nodes, toc: undefined },
    };
  }

  const proseClass = [
    'text-sm/relaxed text-muted-foreground',
    '[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
    '[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2',
    '[&_strong]:font-semibold [&_strong]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground',
    '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-xs [&_:not(pre)>code]:text-foreground',
    '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-4 [&_pre]:text-xs',
  ];
</script>

<template>
  <div :class="proseClass" class="docs-page-body">
    <ContentRenderer v-if="body.intro.length" :value="asDoc(body.intro)" />
    <details
      v-for="section in body.sections"
      :id="section.id"
      :key="section.id"
      :open="OPEN_BY_DEFAULT.has(section.id)"
      class="group border-t border-border/50 py-1 first-of-type:mt-6"
    >
      <summary
        class="-mx-2 flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-2 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring font-display text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden"
      >
        <h2 class="text-base">{{ section.title }}</h2>
        <Icon
          name="lucide:chevron-down"
          class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ContentRenderer :value="asDoc(section.nodes)" />
    </details>
  </div>
</template>

<style scoped>
  /* The left panel is ~400px wide, too narrow for a 4-column props table.
     Each row becomes a small card: name, type and default on one line, the
     description underneath. The markup stays a real <table> for crawlers. */
  .docs-page-body :deep([data-slot='table-container']) {
    margin-block: 0.75rem;
    overflow: hidden;
    border: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
    border-radius: 0.75rem;
  }
  .docs-page-body :deep(table),
  .docs-page-body :deep(tbody),
  .docs-page-body :deep(tr),
  .docs-page-body :deep(td) {
    display: block;
    margin: 0;
    border: 0;
  }
  .docs-page-body :deep(thead) {
    display: none;
  }
  .docs-page-body :deep(tr) {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }
  .docs-page-body :deep(tbody tr:first-child) {
    border-top: 0;
  }
  .docs-page-body :deep(td) {
    padding: 0;
    font-size: 0.75rem;
  }
  .docs-page-body :deep(td:first-child code) {
    color: var(--foreground);
    font-weight: 600;
  }
  .docs-page-body :deep(td:last-child) {
    flex-basis: 100%;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
</style>
