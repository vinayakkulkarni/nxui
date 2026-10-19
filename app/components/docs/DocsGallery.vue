<script setup lang="ts">
  import { Input } from '~/components/ui/input';

  const { visible, query, active, tabs, total } = useGallery();
</script>

<template>
  <section aria-labelledby="gallery-heading" class="space-y-8">
    <div
      class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div class="space-y-1">
        <h2
          id="gallery-heading"
          class="font-display text-2xl font-bold md:text-3xl"
          style="letter-spacing: -0.04em"
        >
          All components
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ total }} live demos. Pick one to see its docs, props and source.
        </p>
      </div>
      <Input
        v-model="query"
        type="search"
        placeholder="Filter components…"
        aria-label="Filter components"
        class="md:w-64"
      />
    </div>

    <div
      role="tablist"
      aria-label="Component categories"
      class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      <button
        v-for="tab in tabs"
        :key="tab"
        role="tab"
        :aria-selected="active === tab"
        :class="[
          'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
          active === tab
            ? 'border-foreground bg-foreground text-background'
            : 'border-border/60 text-muted-foreground hover:text-foreground',
        ]"
        @click="active = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div v-for="group in visible" :key="group.title" class="space-y-4">
      <h3
        class="font-mono text-xs tracking-widest text-muted-foreground uppercase"
      >
        {{ group.title }}
        <span class="text-muted-foreground/60">{{ group.items.length }}</span>
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DocsGalleryTile
          v-for="item in group.items"
          :key="item.path"
          :item="item"
        />
      </div>
    </div>

    <p
      v-if="visible.length === 0"
      class="py-12 text-center text-muted-foreground"
    >
      No components match “{{ query }}”.
    </p>
  </section>
</template>
