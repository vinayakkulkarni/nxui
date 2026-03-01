<script setup lang="ts">
  import type { Component } from 'vue';
  import { useClipboard } from '@vueuse/core';
  import { docsNav } from '~/config/docs';

  definePageMeta({ layout: 'component' });

  const route = useRoute();
  const path = computed(() =>
    route.path.endsWith('/') && route.path !== '/'
      ? route.path.slice(0, -1)
      : route.path,
  );

  const { data: page } = await useAsyncData(`page-${path.value}`, () =>
    queryCollection('docs').path(path.value).first(),
  );

  if (!page.value) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    });
  }

  // Category breadcrumb from route
  const category = computed(() => route.path.split('/')[2] ?? '');
  const formattedCategory = computed(() =>
    category.value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
  );

  // Component slug for installation
  const componentSlug = computed(() => route.path.split('/').pop() ?? '');

  // Dynamic demo component resolution via import.meta.glob
  const demoModules = import.meta.glob<{ default: Component }>(
    '~/components/content/Demo*.vue',
  );

  const slug = route.path.split('/').pop() ?? '';
  const pascal = slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  // Build set of all known page slugs for variant disambiguation
  const allSlugs = new Set(
    docsNav.flatMap((g) =>
      g.items.map((item) => item.path.split('/').pop() ?? ''),
    ),
  );

  // Find all demo variants matching this component
  const demoPrefix = `Demo${pascal}`;
  const demoEntries = Object.keys(demoModules)
    .filter((k) => {
      const filename = (k.split('/').pop() ?? '').replace('.vue', '');
      if (!filename.startsWith(demoPrefix)) return false;
      const rest = filename.slice(demoPrefix.length);
      if (rest === '') return true; // primary demo (exact match)
      if (!/^[A-Z]/.test(rest)) return false; // suffix must start with uppercase
      // Exclude if this file is actually a primary demo for a different page
      const fullKebab = (pascal + rest)
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .slice(1);
      return !allSlugs.has(fullKebab);
    })
    .sort((a, b) => {
      const aExact = a.endsWith(`/${demoPrefix}.vue`) ? 0 : 1;
      const bExact = b.endsWith(`/${demoPrefix}.vue`) ? 0 : 1;
      return aExact - bExact || a.localeCompare(b);
    })
    .map((k) => {
      const filename = (k.split('/').pop() ?? '').replace('.vue', '');
      const suffix = filename.slice(demoPrefix.length);
      const label = suffix
        ? suffix.replace(/([A-Z])/g, ' $1').trim()
        : 'Default';
      return {
        key: k,
        label,
        component: defineAsyncComponent(
          demoModules[k] as () => Promise<{ default: Component }>,
        ),
      };
    });

  const activeVariant = ref(0);
  const DemoComponent = computed(
    () => demoEntries[activeVariant.value]?.component ?? null,
  );
  const hasMultipleVariants = computed(() => demoEntries.length > 1);

  // Provide split mode for ComponentDemo
  const demoCode = ref('');
  const demoRefreshable = ref(false);
  provide('component-demo-code', demoCode);
  provide('component-demo-refreshable', demoRefreshable);

  // Reset code when switching variants
  watch(activeVariant, () => {
    demoCode.value = '';
    demoRefreshable.value = false;
  });
  // Refresh key for replay button
  const refreshKey = ref(0);
  function replay() {
    refreshKey.value++;
  }

  // Code display
  const codeExpanded = ref(false);
  const codeRef = computed(() => demoCode.value || undefined);
  const langRef = computed(() => 'vue');
  const { highlightedHtml } = useShiki(codeRef, langRef);
  const { copy: copyCode, copied: codeCopied } = useClipboard({
    source: () => demoCode.value,
  });

  // Navigation: prev/next from docsNav
  const allItems = computed(() => docsNav.flatMap((g) => g.items));
  const currentIndex = computed(() =>
    allItems.value.findIndex((item) => item.path === path.value),
  );
  const prevItem = computed(() =>
    currentIndex.value > 0 ? allItems.value[currentIndex.value - 1] : null,
  );
  const nextItem = computed(() =>
    currentIndex.value < allItems.value.length - 1
      ? allItems.value[currentIndex.value + 1]
      : null,
  );

  // SEO
  const canonicalUrl = `https://nxui.geoql.in${route.path}`;
  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });
  const ogImageUrl = `https://nxui.geoql.in/og${route.path}.png?title=${encodeURIComponent(page.value?.title ?? 'nxui')}&description=${encodeURIComponent(page.value?.description ?? '')}&category=${encodeURIComponent(formattedCategory.value)}`;
  useSeoMeta({
    title: page.value?.title,
    description: page.value?.description,
    ogTitle: page.value?.title,
    ogDescription: page.value?.description,
    ogType: 'website',
    ogUrl: canonicalUrl,
    ogSiteName: 'nxui',
    ogImage: ogImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterSite: '@vinayakkulkarni',
    twitterTitle: page.value?.title,
    twitterDescription: page.value?.description,
    twitterImage: ogImageUrl,
  });
</script>

<template>
  <div
    v-if="page"
    class="hide-scrollbar flex h-dvh flex-col overflow-hidden lg:flex-row"
  >
    <!-- Left panel: docs/code (1/3) -->
    <div
      class="relative order-last flex min-h-0 flex-1 flex-col border-t border-border/30 lg:order-first lg:w-1/3 lg:max-w-[33.333%] lg:border-l lg:border-t-0"
    >
      <!-- Scrollable content with edge fade -->
      <div
        class="hide-scrollbar scroll-fade-y min-h-0 flex-1 overflow-y-auto p-6 lg:p-10 lg:pt-12"
      >
        <!-- Breadcrumb -->
        <NuxtLink
          to="/docs"
          class="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="lucide:arrow-left" class="size-3" />
          {{ formattedCategory }}
        </NuxtLink>

        <!-- Title -->
        <h1
          class="mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text font-display text-2xl font-bold text-transparent lg:text-4xl"
          style="letter-spacing: -0.04em; line-height: 1.1"
        >
          {{ page.title }}
        </h1>

        <!-- Description -->
        <p
          v-if="page.description"
          class="mb-8 font-serif text-base/relaxed italic text-muted-foreground"
        >
          {{ page.description }}
        </p>

        <!-- Code block -->
        <div v-if="demoCode" class="not-prose">
          <button
            class="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            :aria-expanded="codeExpanded"
            aria-controls="code-panel"
            @click="codeExpanded = !codeExpanded"
          >
            <Icon name="lucide:code" class="size-3.5" />
            <span>{{ codeExpanded ? 'Hide code' : 'View code' }}</span>
            <Icon
              name="lucide:chevron-down"
              :class="[
                'size-3 transition-transform duration-200',
                codeExpanded ? 'rotate-180' : '',
              ]"
            />
          </button>

          <div
            v-show="codeExpanded"
            id="code-panel"
            role="region"
            aria-label="Source code"
            class="relative overflow-hidden rounded-xl border border-border/50"
          >
            <button
              class="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              :class="codeCopied ? 'text-foreground' : ''"
              :aria-label="codeCopied ? 'Copied' : 'Copy code'"
              @click="copyCode(demoCode)"
            >
              <Icon
                :name="codeCopied ? 'lucide:check' : 'lucide:copy'"
                class="size-3.5"
              />
            </button>

            <div
              class="shiki-wrapper max-h-[60vh] overflow-auto text-sm [&_pre]:m-0! [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:px-4 [&_pre]:py-4 [&_code]:text-[13px]! [&_code]:leading-relaxed!"
              v-html="highlightedHtml"
            ></div>
          </div>
        </div>

        <!-- Installation -->
        <DocsInstallTabs :component="componentSlug" class="mt-8" />
      </div>
      <!-- Sticky footer: navigation -->
      <div class="shrink-0 px-4 pb-2 pt-1 lg:px-10 lg:pb-4 lg:pt-2">
        <DocsComponentNavigation
          :prev="prevItem ?? null"
          :next="nextItem ?? null"
        />
      </div>
    </div>

    <!-- Right panel: live preview (2/3) -->
    <div
      role="img"
      :aria-label="
        page.title ? `Interactive demo: ${page.title}` : 'Interactive demo'
      "
      class="relative order-first h-[50dvh] overflow-hidden bg-muted/30 dark:bg-background lg:order-last lg:h-dvh lg:w-2/3"
    >
      <!-- Refresh button for animation demos -->
      <button
        v-if="demoRefreshable"
        class="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-md border border-border bg-background/50 text-muted-foreground backdrop-blur-sm transition-all hover:bg-background hover:text-foreground"
        aria-label="Replay animation"
        @click="replay"
      >
        <Icon name="lucide:rotate-ccw" class="size-4" />
      </button>

      <!-- Demo component -->
      <div
        v-if="DemoComponent"
        :key="`${activeVariant}-${refreshKey}`"
        class="size-full overflow-hidden"
      >
        <component :is="DemoComponent" />
      </div>

      <!-- Variant pills -->
      <template v-if="hasMultipleVariants">
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-linear-to-t from-black/40 to-transparent"
        ></div>
        <div
          class="absolute inset-x-0 bottom-6 z-30 flex flex-wrap justify-center gap-2 px-4"
        >
          <button
            v-for="(entry, i) in demoEntries"
            :key="entry.key"
            class="rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
            :class="
              activeVariant === i
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            "
            @click="activeVariant = i"
          >
            {{ entry.label }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
