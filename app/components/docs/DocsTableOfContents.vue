<script setup lang="ts">
  import type { TocHeading } from '~/types/docs';

  const route = useRoute();
  const headings = ref<TocHeading[]>([]);
  const activeId = ref('');
  const navRef = ref<HTMLElement | null>(null);
  const isScrolling = ref(false);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function extractHeadings() {
    const elements = document.querySelectorAll('main h2, main h3');
    const items: TocHeading[] = [];
    const seenIds = new Set<string>();

    elements.forEach((elem) => {
      const text = (elem.textContent ?? '').trim();
      if (!text) return;

      if (!elem.id) {
        let id = slugify(text);
        let counter = 1;
        while (seenIds.has(id)) {
          id = `${slugify(text)}-${counter++}`;
        }
        elem.id = id;
      }

      if (!seenIds.has(elem.id)) {
        seenIds.add(elem.id);
        const level = elem.tagName === 'H2' ? 2 : 3;
        items.push({ id: elem.id, text, level });
      }
    });

    headings.value = items;
    if (items.length > 0) {
      activeId.value = items[0]!.id;
    }
  }

  function handleClick(e: Event, headingId: string) {
    e.preventDefault();
    isScrolling.value = true;
    activeId.value = headingId;
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      isScrolling.value = false;
    }, 600);
  }

  function findActiveHeading() {
    if (isScrolling.value) return;
    let active = '';
    for (const heading of headings.value) {
      const el = document.getElementById(heading.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= 120) {
        active = heading.id;
      }
    }
    if (active) {
      activeId.value = active;
    } else if (headings.value.length > 0) {
      activeId.value = headings.value[0]!.id;
    }
  }

  onMounted(() => {
    setTimeout(() => extractHeadings(), 500);

    watch(
      () => route.path,
      () => setTimeout(() => extractHeadings(), 500),
    );

    window.addEventListener('scroll', findActiveHeading, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', findActiveHeading);
  });
</script>

<template>
  <aside
    class="hidden w-64 shrink-0 border-l border-border/30 xl:block dark:border-white/[0.06]"
  >
    <div
      class="sticky top-16 flex h-[calc(100svh-4rem)] flex-col overflow-y-auto py-10 pl-6 pr-4"
    >
      <div v-if="headings.length > 0" class="flex-1">
        <p
          class="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60"
        >
          On This Page
        </p>

        <nav ref="navRef" class="relative flex flex-col">
          <div
            class="absolute bottom-0 left-0 top-0 w-px bg-border/50 dark:bg-white/[0.06]"
          ></div>
          <a
            v-for="heading in headings"
            :key="heading.id"
            :href="`#${heading.id}`"
            :class="[
              'relative py-1.5 pr-2 text-[13px] transition-all duration-200',
              heading.level === 3 ? 'pl-6' : 'pl-4',
              activeId === heading.id
                ? 'font-medium text-foreground'
                : 'text-muted-foreground/70 hover:text-foreground',
            ]"
            @click="handleClick($event, heading.id)"
          >
            <div
              v-if="activeId === heading.id"
              class="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            ></div>
            {{ heading.text }}
          </a>
        </nav>
      </div>

      <div class="mt-auto pt-6">
        <div
          class="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-4 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
        >
          <div class="space-y-1">
            <h4 class="text-sm font-medium tracking-tight text-foreground">
              Need custom components?
            </h4>
            <p class="text-xs leading-relaxed text-muted-foreground">
              Get bespoke UI components &amp; stunning websites tailored for
              your brand.
            </p>
          </div>
          <NuxtLink
            to="https://vinayakkulkarni.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30"
          >
            Get in touch
            <Icon
              name="lucide:arrow-right"
              class="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </aside>
</template>
