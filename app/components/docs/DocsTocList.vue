<script setup lang="ts">
  import type { TocHeading } from '~/types/docs';

  defineProps<{
    headings: TocHeading[];
    activeId: string;
  }>();

  const emit = defineEmits<{
    select: [e: Event, id: string];
  }>();

  const navRef = ref<HTMLElement | null>(null);
</script>

<template>
  <div class="flex-1">
    <p
      class="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60"
    >
      On This Page
    </p>

    <nav ref="navRef" class="relative flex flex-col">
      <div
        class="absolute inset-y-0 left-0 w-px bg-border/50 dark:bg-white/6"
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
        @click="emit('select', $event, heading.id)"
      >
        <div
          v-if="activeId === heading.id"
          class="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
        ></div>
        {{ heading.text }}
      </a>
    </nav>
  </div>
</template>
