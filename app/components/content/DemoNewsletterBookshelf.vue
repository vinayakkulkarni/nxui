<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import NewsletterBookshelf from '@registry/new-york/newsletter-bookshelf/NewsletterBookshelf.vue';
  import type { Pane } from 'tweakpane';
  import type {
    NewsletterBookshelfItem,
    NewsletterBookshelfProps,
  } from '@registry/new-york/newsletter-bookshelf/types';

  const params = reactive<Required<Pick<NewsletterBookshelfProps, 'brand'>>>({
    brand: 'The Brief',
  });

  const selected = ref<NewsletterBookshelfItem | null>(null);

  function onSelect(item: NewsletterBookshelfItem) {
    selected.value = item;
  }

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'brand');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import NewsletterBookshelf from '~/components/ui/newsletter-bookshelf/NewsletterBookshelf.vue';
  import type { NewsletterBookshelfItem } from '~/components/ui/newsletter-bookshelf/types';

  const editions: NewsletterBookshelfItem[] = [
    { id: 'edition-04', title: 'The useful systems issue', date: 'JUL 24, 2026', href: '/posts/useful-systems' },
    { id: 'edition-03', title: 'A better creative workflow', date: 'JUL 17, 2026', href: '/posts/creative-workflow' },
    { id: 'edition-02', title: 'Notes on building in public', date: 'JUL 10, 2026', color: '#efe8d4' },
    { id: 'edition-01', title: 'The small team advantage', date: 'JUL 3, 2026', color: '#16277a' },
  ];

  function onSelect(edition: NewsletterBookshelfItem) {
    console.log('Selected', edition.id);
  }
</script>

<template>
  <NewsletterBookshelf
    :items=&quot;editions&quot;
    brand=&quot;Studio Notes&quot;
    @select=&quot;onSelect&quot;
  />
</template>`"
  >
    <div class="relative size-full min-h-80 overflow-hidden rounded-lg">
      <NewsletterBookshelf
        class="absolute inset-0 size-full"
        height="100%"
        :brand="params.brand"
        @select="onSelect"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-4 text-center font-mono text-xs text-neutral-500"
      >
        <template v-if="selected">
          {{ selected.title }} · drag to turn, Esc to return
        </template>
        <template v-else>
          drag or scroll sideways to browse · click a book to inspect
        </template>
      </p>
      <ShaderPane title="Bookshelf" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
