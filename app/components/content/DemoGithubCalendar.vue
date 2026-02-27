<script setup lang="ts">
  import { ref, computed } from 'vue';
  import GithubCalendar from '@registry/new-york/GithubCalendar/GithubCalendar.vue';

  const activeTab = ref(0);

  const variants: {
    label: string;
    props: Record<string, unknown>;
    code: string;
  }[] = [
    {
      label: 'Default',
      props: { username: 'vinayakkulkarni' },
      code: `\x3Cscript setup lang="ts">
  import GithubCalendar from '~/components/ui/GithubCalendar.vue';
\x3C/script>

\x3Ctemplate>
  \x3CGithubCalendar username="vinayakkulkarni" />
\x3C/template>`,
    },
    {
      label: 'Grayscale',
      props: { username: 'vinayakkulkarni', colorSchema: 'gray' },
      code: `\x3Cscript setup lang="ts">
  import GithubCalendar from '~/components/ui/GithubCalendar.vue';
\x3C/script>

\x3Ctemplate>
  \x3CGithubCalendar username="vinayakkulkarni" color-schema="gray" />
\x3C/template>`,
    },
    {
      label: 'Minimal',
      props: {
        username: 'vinayakkulkarni',
        variant: 'minimal',
        colorSchema: 'blue',
      },
      code: `\x3Cscript setup lang="ts">
  import GithubCalendar from '~/components/ui/GithubCalendar.vue';
\x3C/script>

\x3Ctemplate>
  \x3CGithubCalendar username="vinayakkulkarni" variant="minimal" color-schema="blue" />
\x3C/template>`,
    },
    {
      label: 'Orange',
      props: {
        username: 'vinayakkulkarni',
        colorSchema: 'orange',
        showTotal: false,
      },
      code: `\x3Cscript setup lang="ts">
  import GithubCalendar from '~/components/ui/GithubCalendar.vue';
\x3C/script>

\x3Ctemplate>
  \x3CGithubCalendar username="vinayakkulkarni" color-schema="orange" :show-total="false" />
\x3C/template>`,
    },
  ];

  const currentVariant = computed(() => variants[activeTab.value]);

  function handleTabClick(index: number) {
    activeTab.value = index;
  }
</script>

<template>
  <ComponentDemo :code="currentVariant.code">
    <div
      class="flex flex-col items-center justify-center gap-6 w-full overflow-hidden py-4"
    >
      <div class="scale-[0.55] md:scale-[0.7] origin-center">
        <GithubCalendar v-bind="currentVariant.props" />
      </div>
      <div class="flex gap-2">
        <button
          v-for="(variant, index) in variants"
          :key="variant.label"
          class="px-3 py-1 text-xs rounded-full transition-colors"
          :class="
            activeTab === index
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          "
          @click="handleTabClick(index)"
        >
          {{ variant.label }}
        </button>
      </div>
    </div>
  </ComponentDemo>
</template>
