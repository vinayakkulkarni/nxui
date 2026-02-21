<script setup lang="ts">
  import type { NavItem } from '~/types/docs';

  defineProps<{
    title: string;
    items: NavItem[];
    activeHref: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs uppercase tracking-widest text-muted-foreground/60">
      {{ title }}
    </p>
    <ul class="space-y-1">
      <li v-for="item in items" :key="item.path">
        <NuxtLink
          :to="item.path"
          :class="[
            'group relative flex items-center gap-2 py-1 pl-4 pr-3 text-sm transition-colors',
            activeHref === item.path
              ? 'text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="emit('close')"
        >
          <span
            v-if="activeHref === item.path"
            class="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-foreground"
          ></span>
          <span class="flex-1">{{ item.title }}</span>
          <span
            v-if="item.badge"
            class="ml-auto inline-flex items-center rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-violet-500 dark:bg-violet-400/10 dark:text-violet-400"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
