<script setup lang="ts">
  import type { Testimonial } from './types';

  defineProps<{
    item: Testimonial;
    variant?: 'default' | 'flush';
  }>();
</script>

<template>
  <div
    v-if="variant === 'flush'"
    class="group relative flex h-auto w-87.5 shrink-0 flex-col justify-between overflow-hidden rounded-none border-r border-border bg-black/7 p-6 shadow-sm transition-all hover:bg-black/12 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10 transform-gpu [backface-visibility:hidden]"
  >
    <div
      class="absolute inset-0 bg-linear-to-br from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5"
    ></div>
    <div class="relative z-10 flex flex-col gap-4">
      <p class="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        &quot;{{ item.text }}&quot;
      </p>
      <div class="flex items-center gap-3 pt-2">
        <div
          class="size-10 shrink-0 overflow-hidden rounded-full border border-border"
        >
          <img
            :src="item.avatar"
            :alt="item.name"
            class="size-full object-cover"
            loading="eager"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-foreground">{{
            item.name
          }}</span>
          <span v-if="item.username" class="text-xs text-muted-foreground"
            >@{{ item.username }}</span
          >
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="group relative flex h-auto w-87.5 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-black/7 p-6 shadow-sm transition-all hover:-translate-y-1 hover:bg-black/12 hover:shadow-xl hover:shadow-black/5 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10 transform-gpu [backface-visibility:hidden]"
  >
    <div
      class="absolute inset-0 bg-linear-to-br from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5"
    ></div>
    <div class="relative z-10 flex flex-col gap-4">
      <p class="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        &quot;{{ item.text }}&quot;
      </p>
      <div class="flex items-center gap-3 pt-2">
        <div
          class="size-10 shrink-0 overflow-hidden rounded-full border border-border"
        >
          <img
            :src="item.avatar"
            :alt="item.name"
            class="size-full object-cover"
            loading="eager"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-foreground">{{
            item.name
          }}</span>
          <span v-if="item.username" class="text-xs text-muted-foreground"
            >@{{ item.username }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
