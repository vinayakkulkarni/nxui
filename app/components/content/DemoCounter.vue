<script setup lang="ts">
  import { ref } from 'vue';
  import Counter from '@registry/new-york/Counter/Counter.vue';

  const value = ref(1234);

  function randomize() {
    value.value = Math.floor(Math.random() * 10000);
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Counter from '~/components/ui/Counter.vue';
</script>

<template>
  <Counter :value=&quot;1234&quot; :font-size=&quot;80&quot; :gradient-from=&quot;var(--background)&quot; />
</template>`"
  >
    <div
      class="flex h-[300px] w-full flex-col items-center justify-center gap-6 rounded-lg"
    >
      <Counter
        :value="value"
        :font-size="80"
        :gradient-from="'var(--background)'"
      />
      <button
        class="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        @click="randomize"
      >
        Randomize
      </button>
    </div>
  </ComponentDemo>
</template>
