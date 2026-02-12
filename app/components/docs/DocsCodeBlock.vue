<script setup lang="ts">
  import { codeToHtml } from 'shiki';

  const props = withDefaults(
    defineProps<{
      code: string;
      language?: string;
      filename?: string;
    }>(),
    {
      language: 'vue',
    },
  );

  const colorMode = useColorMode();

  const highlighted = computedAsync(async () => {
    const theme =
      colorMode.preference === 'dark' ? 'github-dark' : 'github-light';
    return codeToHtml(props.code, {
      lang: props.language,
      theme,
    });
  }, '');
</script>

<template>
  <div class="relative rounded-lg border bg-muted/50">
    <div
      v-if="filename"
      class="flex items-center border-b px-4 py-2 text-xs text-muted-foreground"
    >
      {{ filename }}
    </div>
    <div class="relative">
      <DocsCopyButton :text="code" class="absolute right-2 top-2 z-10" />
      <div
        class="overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent [&_pre]:!p-0"
        v-html="highlighted"
      />
    </div>
  </div>
</template>
