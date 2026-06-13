<script setup lang="ts">
  import type { OrbitStackItem } from './types';

  const props = defineProps<{
    item: OrbitStackItem;
  }>();

  function getInitials(item: OrbitStackItem): string {
    if (item.initials) return item.initials;
    return item.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const initials = computed(() => getInitials(props.item));
</script>

<template>
  <div
    v-if="item.image"
    class="relative flex aspect-[1.36] w-full overflow-hidden rounded-[1.45rem] border border-black/8 bg-black/4.5"
  >
    <img :src="item.image" :alt="item.name" class="size-full object-cover" />
    <div
      class="absolute bottom-4 right-4 rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white"
    >
      {{ initials }}
    </div>
  </div>
  <div
    v-else
    class="relative flex aspect-[1.36] w-full overflow-hidden rounded-[1.45rem] border border-black/8 bg-black/4.5"
    :style="{ '--accent': item.accent ?? '#f3f1ea' }"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,var(--accent),transparent_24%),radial-gradient(circle_at_85%_72%,rgba(255,255,255,0.5),transparent_28%)] opacity-45"
    />
    <div
      class="absolute inset-x-8 bottom-0 h-[72%] rounded-t-[999px] border-2 border-zinc-950 bg-[#f7f5ef]"
    />
    <div
      class="absolute left-1/2 top-[22%] size-24 -translate-x-1/2 rounded-[45%_55%_48%_52%] border-2 border-zinc-950 bg-[#f5f2eb]"
    >
      <div
        class="absolute left-1/2 top-[42%] h-2 w-10 -translate-x-1/2 rounded-full bg-zinc-950 opacity-80"
      />
      <div
        class="absolute left-[27%] top-[34%] size-2 rounded-full bg-zinc-950"
      />
      <div
        class="absolute right-[27%] top-[34%] size-2 rounded-full bg-zinc-950"
      />
      <div
        class="absolute left-1/2 top-[52%] h-6 w-4 -translate-x-1/2 rounded-b-full border-b-2 border-zinc-950"
      />
      <div
        class="absolute -top-5 left-1/2 h-9 w-24 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-zinc-950"
        :style="{ backgroundColor: item.accent ?? '#f3f1ea' }"
      />
    </div>
    <div
      class="absolute bottom-4 right-4 rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white"
    >
      {{ initials }}
    </div>
  </div>
</template>
