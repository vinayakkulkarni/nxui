<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      name: string;
      dependencies?: string[];
      code?: string;
    }>(),
    {
      dependencies: () => [],
      code: '',
    },
  );

  const cliCommand = computed(
    () => `npx shadcn-vue@latest add "https://nxui.dev/r/${props.name}.json"`,
  );

  const installCommands = computed(() => {
    if (props.dependencies.length === 0) return null;
    const deps = props.dependencies.join(' ');
    return {
      npm: `npm install ${deps}`,
      pnpm: `pnpm add ${deps}`,
      yarn: `yarn add ${deps}`,
      bun: `bun add ${deps}`,
    };
  });
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Installation</h2>
    <UiTabs default-value="cli">
      <UiTabsList>
        <UiTabsTrigger value="cli">CLI</UiTabsTrigger>
        <UiTabsTrigger value="manual">Manual</UiTabsTrigger>
      </UiTabsList>
      <UiTabsContent value="cli" class="mt-4">
        <DocsCodeBlock :code="cliCommand" language="bash" />
      </UiTabsContent>
      <UiTabsContent value="manual" class="mt-4 space-y-4">
        <div v-if="installCommands">
          <p class="mb-2 text-sm font-medium">1. Install dependencies</p>
          <UiTabs default-value="bun">
            <UiTabsList>
              <UiTabsTrigger value="npm">npm</UiTabsTrigger>
              <UiTabsTrigger value="pnpm">pnpm</UiTabsTrigger>
              <UiTabsTrigger value="yarn">yarn</UiTabsTrigger>
              <UiTabsTrigger value="bun">bun</UiTabsTrigger>
            </UiTabsList>
            <UiTabsContent
              v-for="(cmd, pm) in installCommands"
              :key="pm"
              :value="pm"
              class="mt-2"
            >
              <DocsCodeBlock :code="cmd" language="bash" />
            </UiTabsContent>
          </UiTabs>
        </div>
        <div v-if="code">
          <p class="mb-2 text-sm font-medium">
            {{ installCommands ? '2.' : '1.' }} Copy the source code
          </p>
          <DocsCodeBlock :code="code" language="vue" />
        </div>
      </UiTabsContent>
    </UiTabs>
  </div>
</template>
