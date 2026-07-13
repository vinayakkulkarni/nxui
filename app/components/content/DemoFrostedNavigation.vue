<script setup lang="ts">
  import { ref } from 'vue';
  import FrostedNavigation from '@registry/new-york/frosted-navigation/FrostedNavigation.vue';

  const active = ref('everything');
  const query = ref('');

  const tabs = [
    { id: 'everything', label: 'Everything', icon: 'lucide:layout-grid' },
    { id: 'spaces', label: 'Spaces', icon: 'lucide:circle' },
    { id: 'serendipity', label: 'Serendipity', icon: 'lucide:sparkles' },
  ];

  const cards = [
    { h: 'h-40', c: 'bg-orange-600', label: 'Top of Mind' },
    {
      h: 'h-28',
      c: 'bg-linear-to-b from-orange-400 to-red-600',
      label: 'Day 1000',
    },
    { h: 'h-48', c: 'bg-neutral-900', label: 'WHY NOT?' },
    { h: 'h-36', c: 'bg-emerald-800', label: 'Research Lab' },
    { h: 'h-44', c: 'bg-rose-700', label: 'Into the mind' },
    { h: 'h-32', c: 'bg-indigo-900', label: 'Taste is what you notice' },
    { h: 'h-40', c: 'bg-amber-700', label: 'Give me something' },
    { h: 'h-28', c: 'bg-teal-800', label: 'Moment Hunt' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import FrostedNavigation from '~/components/ui/frosted-navigation/FrostedNavigation.vue';

  const active = ref('everything');
  const query = ref('');

  const tabs = [
    { id: 'everything', label: 'Everything', icon: 'lucide:layout-grid' },
    { id: 'spaces', label: 'Spaces', icon: 'lucide:circle' },
    { id: 'serendipity', label: 'Serendipity', icon: 'lucide:sparkles' },
  ];
</script>

<template>
  <!-- Place inside a relative, overflow-hidden scroll container -->
  <div class=&quot;relative h-150 overflow-hidden&quot;>
    <div class=&quot;h-full overflow-y-auto&quot;>
      <!-- your content -->
    </div>
    <FrostedNavigation
      v-model=&quot;active&quot;
      v-model:query=&quot;query&quot;
      :tabs=&quot;tabs&quot;
      accent=&quot;#f43f16&quot;
      :frost-height=&quot;220&quot;
    />
  </div>
</template>`"
  >
    <div
      class="relative size-full min-h-100 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-950"
    >
      <!-- Scrollable masonry content behind the frost -->
      <div class="h-full overflow-y-auto p-4">
        <div class="columns-2 gap-3">
          <div
            v-for="(card, i) in cards"
            :key="i"
            :class="[
              'mb-3 flex break-inside-avoid items-end rounded-xl p-3',
              card.h,
              card.c,
            ]"
          >
            <span class="font-serif text-sm text-white/90">{{
              card.label
            }}</span>
          </div>
          <div class="h-24" />
        </div>
      </div>

      <FrostedNavigation
        v-model="active"
        v-model:query="query"
        :tabs="tabs"
        accent="#f43f16"
        :frost-height="200"
      />
    </div>
  </ComponentDemo>
</template>
