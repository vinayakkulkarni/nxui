<script setup lang="ts">
import type { NavItem } from '~/types/docs';

defineProps<{
  title: string;
  items: NavItem[];
  activeHref: string | null;
}>();

const isExpanded = ref(true);

function toggle() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div>
    <button
      :class="[
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors',
        activeHref
          ? 'text-foreground'
          : 'text-muted-foreground/70 hover:text-foreground',
      ]"
      @click="toggle"
    >
      <span>{{ title }}</span>
      <Icon
        name="lucide:chevron-down"
        :class="[
          'size-3 text-muted-foreground/50 transition-transform duration-200',
          isExpanded ? '' : '-rotate-90',
        ]"
      />
    </button>

    <div
      class="grid transition-all duration-200 ease-out"
      :style="{
        gridTemplateRows: isExpanded ? '1fr' : '0fr',
        opacity: isExpanded ? 1 : 0,
      }"
    >
      <div class="overflow-hidden">
        <div class="space-y-0.5 pt-0.5 pb-1">
          <DocsSidebarItem
            v-for="item in items"
            :key="item.path"
            :title="item.title"
            :path="item.path"
            :is-active="activeHref === item.path"
          />
        </div>
      </div>
    </div>
  </div>
</template>
