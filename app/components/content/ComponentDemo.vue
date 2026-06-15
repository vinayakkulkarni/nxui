<script setup lang="ts">
  import { motion } from 'motion-v';
  import { useClipboard } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      class?: string;
      fullWidth?: boolean;
      code?: string;
      refreshable?: boolean;
    }>(),
    { class: '', fullWidth: false, code: undefined, refreshable: false },
  );

  // Split mode: when rendered inside the split-layout page,
  // only render the demo content (slot) and push code upward
  const splitCodeTarget = inject<Ref<string> | null>(
    'component-demo-code',
    null,
  );
  const splitRefreshableTarget = inject<Ref<boolean> | null>(
    'component-demo-refreshable',
    null,
  );
  const isSplitMode = computed(() => splitCodeTarget !== null);

  // In split mode, push code and refreshable flag to the parent page
  if (splitCodeTarget && props.code) {
    splitCodeTarget.value = props.code;
  }
  if (splitRefreshableTarget) {
    splitRefreshableTarget.value = props.refreshable;
  }

  const codeExpanded = ref(true);
  const refreshKey = ref(0);
  const { copy, copied } = useClipboard({ source: () => props.code ?? '' });

  function replay() {
    refreshKey.value++;
  }

  const codeRef = computed(() => props.code);
  const langRef = computed(() => 'vue');
  const { highlightedHtml } = useShiki(codeRef, langRef);
</script>

<template>
  <!-- Split mode: fill the panel, override child height constraints, center bare components -->
  <div
    v-if="isSplitMode"
    :key="refreshable ? refreshKey : undefined"
    class="size-full overflow-hidden *:size-full! *:rounded-none!"
  >
    <slot></slot>
  </div>

  <!-- Normal mode: existing card behavior -->
  <component
    :is="motion.div"
    v-else
    :initial="{ opacity: 0, y: 16, scale: 0.98 }"
    :animate="{ opacity: 1, y: 0, scale: 1 }"
    :transition="{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }"
    class="not-prose relative my-6 w-full overflow-hidden rounded-xl border border-border/50"
  >
    <!-- Preview area -->
    <div
      :class="
        cn(
          'relative w-full bg-muted/30 dark:bg-background',
          code ? 'rounded-t-xl' : 'rounded-xl',
          fullWidth
            ? 'min-h-75'
            : 'flex min-h-87.5 items-center justify-center p-6',
          props.class,
        )
      "
    >
      <!-- Refresh button for animation demos -->
      <button
        v-if="refreshable"
        class="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-md border border-border bg-background/50 text-muted-foreground transition-all hover:bg-background hover:text-foreground"
        aria-label="Replay animation"
        @click="replay"
      >
        <Icon name="lucide:rotate-ccw" class="size-4" />
      </button>
      <div v-if="refreshable" :key="refreshKey" class="contents">
        <slot></slot>
      </div>
      <slot v-else></slot>
    </div>

    <!-- Code footer -->
    <div v-if="code" class="border-t border-border/50">
      <!-- Toggle bar -->
      <button
        class="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        @click="codeExpanded = !codeExpanded"
      >
        <span class="flex items-center gap-2">
          <Icon name="lucide:code" class="size-3.5" />
          Code
        </span>
        <Icon
          name="lucide:chevron-down"
          :class="[
            'size-3.5 transition-transform duration-200',
            codeExpanded ? 'rotate-180' : '',
          ]"
        />
      </button>

      <!-- Code block -->
      <div v-show="codeExpanded" class="relative border-t border-border/30">
        <!-- Copy button -->
        <button
          class="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          :class="copied ? 'text-foreground' : ''"
          :aria-label="copied ? 'Copied' : 'Copy code'"
          @click="copy(code!)"
        >
          <Icon
            :name="copied ? 'lucide:check' : 'lucide:copy'"
            class="size-3.5"
          />
        </button>

        <!-- Scrollable code -->
        <!-- eslint-disable vue/no-v-html -- highlightedHtml is trusted build-time Shiki output, never user input -->
        <div
          class="shiki-wrapper max-h-100 overflow-auto text-sm [&_pre]:m-0! [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:bg-transparent! [&_pre]:p-4 [&_code]:text-[13px]! [&_code]:leading-relaxed!"
          v-html="highlightedHtml"
        ></div>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </component>
</template>
