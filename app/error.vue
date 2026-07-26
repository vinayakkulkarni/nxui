<script setup lang="ts">
  import type { NuxtError } from '#app';
  import { errorCopyFor } from '~/lib/error-copy';

  const props = defineProps<{ error: NuxtError }>();

  const copy = computed(() => errorCopyFor(props.error.statusCode));

  useHead(() => ({ title: `${copy.value.heading} · nxui` }));

  const goHome = () => clearError({ redirect: '/docs' });
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-background px-4"
  >
    <p
      class="font-mono text-7xl font-light tracking-tight text-muted-foreground sm:text-8xl"
    >
      {{ error.statusCode }}
    </p>

    <h1 class="mt-6 text-2xl font-semibold tracking-tight text-foreground">
      {{ copy.heading }}
    </h1>

    <p class="mt-3 max-w-md text-center text-sm text-muted-foreground">
      {{ copy.detail }}
    </p>

    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Button size="sm" @click="goHome">{{ copy.action }}</Button>
      <Button variant="ghost" size="sm" as-child>
        <a href="https://github.com/vinayakkulkarni/nxui">View on GitHub</a>
      </Button>
    </div>
  </div>
</template>
