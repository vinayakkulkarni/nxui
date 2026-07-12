<script setup lang="ts">
  import { useClipboard } from '@vueuse/core';
  import type { RegistryItemFile } from '~/types/mcp';

  const props = defineProps<{
    files: RegistryItemFile[];
  }>();

  const activeIndex = ref(0);

  const activeFile = computed(() => props.files[activeIndex.value] ?? null);
  const activeCode = computed(() => activeFile.value?.content ?? undefined);
  const activeLang = computed(() =>
    activeFile.value?.path.endsWith('.vue') ? 'vue' : 'typescript',
  );
  const fileName = computed(
    () => activeFile.value?.path.split('/').pop() ?? '',
  );

  const { highlightedHtml } = useShiki(activeCode, activeLang);
  const { copy, copied } = useClipboard({
    source: () => activeFile.value?.content ?? '',
  });
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div
      class="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5"
    >
      <div class="flex min-w-0 items-center gap-1.5">
        <Icon
          name="lucide:file-code"
          class="size-3.5 shrink-0 text-muted-foreground/60"
        />
        <span class="truncate font-mono text-xs text-muted-foreground">
          {{ activeFile?.target ?? fileName }}
        </span>
      </div>
      <button
        class="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
        :class="copied ? 'text-foreground' : ''"
        :aria-label="copied ? 'Copied' : 'Copy source'"
        @click="copy()"
      >
        <Icon
          :name="copied ? 'lucide:check' : 'lucide:copy'"
          class="size-3.5"
        />
      </button>
    </div>

    <div
      v-if="files.length > 1"
      class="flex shrink-0 gap-1 overflow-x-auto border-b border-border/50 px-3 py-2"
    >
      <button
        v-for="(file, i) in files"
        :key="file.path"
        class="shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors"
        :class="
          activeIndex === i
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="activeIndex = i"
      >
        {{ file.path.split('/').pop() }}
      </button>
    </div>

    <!-- eslint-disable vue/no-v-html -- highlightedHtml is trusted build-time Shiki output of our own registry source, never user input -->
    <div
      class="shiki-wrapper min-h-0 flex-1 overflow-auto text-sm [&_pre]:m-0! [&_pre]:min-h-full [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:p-4 [&_code]:text-[13px]! [&_code]:leading-relaxed!"
      v-html="highlightedHtml"
    ></div>
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>
