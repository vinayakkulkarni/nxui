<script setup lang="ts">
  const props = defineProps<{
    component: string;
  }>();

  type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

  const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

  const COMMANDS: Record<PackageManager, string> = {
    npm: 'npx shadcn@latest add',
    pnpm: 'pnpm dlx shadcn@latest add',
    yarn: 'yarn dlx shadcn@latest add',
    bun: 'bunx shadcn@latest add',
  };

  const selected = ref<PackageManager>('npm');

  const baseUrl = useRuntimeConfig().public?.siteUrl ?? 'https://nxui.geoql.in';
  const componentUrl = computed(() => `${baseUrl}/r/${props.component}.json`);
  const command = computed(
    () => `${COMMANDS[selected.value]} "${componentUrl.value}"`,
  );
  const prefix = computed(() => {
    const map: Record<PackageManager, string> = {
      npm: 'npx',
      pnpm: 'pnpm dlx',
      yarn: 'yarn dlx',
      bun: 'bunx',
    };
    return map[selected.value];
  });

  function selectPm(pm: PackageManager) {
    selected.value = pm;
  }
</script>

<template>
  <div
    class="relative rounded-xl overflow-hidden border border-border bg-zinc-100 dark:bg-zinc-950"
  >
    <div
      class="flex items-center border-b border-border/10 bg-white/50 dark:bg-zinc-900/50 p-2"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex size-8 items-center justify-center rounded-md border border-border/10 bg-white dark:bg-zinc-800/50 shadow-sm dark:shadow-none"
        >
          <Icon name="lucide:terminal" class="size-3.5 text-muted-foreground" />
        </div>
        <div
          class="flex items-center gap-1 rounded-md bg-zinc-200/50 dark:bg-zinc-950 p-1 ring-1 ring-border/10"
        >
          <button
            v-for="pm in PACKAGE_MANAGERS"
            :key="pm"
            :class="[
              'rounded px-2 py-1 text-xs font-medium transition-all',
              selected === pm
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="selectPm(pm)"
          >
            {{ pm }}
          </button>
        </div>
      </div>
    </div>

    <div class="relative">
      <pre
        class="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-zinc-100"
      ><span class="text-zinc-400 dark:text-zinc-500 mr-2">$</span><span class="text-purple-600 dark:text-purple-400">{{ prefix }}</span><span class="text-zinc-600 dark:text-zinc-400"> shadcn@latest add</span> <span class="text-green-600 dark:text-green-400">"{{ componentUrl }}"</span></pre>
      <DocsCopyButton :code="command" />
    </div>
  </div>
</template>
