<script setup lang="ts">
  import { useClipboard, useTimeoutFn } from '@vueuse/core';

  const props = defineProps<{
    text: string;
  }>();

  const { copy } = useClipboard();
  const copied = ref(false);

  const { start: resetCopied } = useTimeoutFn(
    () => {
      copied.value = false;
    },
    2000,
    { immediate: false },
  );

  async function handleCopy() {
    await copy(props.text);
    copied.value = true;
    resetCopied();
  }
</script>

<template>
  <button
    class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    @click="handleCopy"
  >
    <Icon
      :name="copied ? 'lucide:check' : 'lucide:copy'"
      class="size-3.5"
    />
  </button>
</template>
