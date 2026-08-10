<script setup lang="ts">
  const colorMode = useColorMode();
  const { showFps, toggle: toggleFps } = useFpsMeter();

  function toggleColorMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }
</script>

<template>
  <div
    class="pointer-events-none absolute left-3 top-3 z-30 hidden items-center gap-1 lg:flex"
  >
    <DocsCommandMenu compact />
    <DocsSourceCode />
    <DocsToolbarNavSheet />
    <DocsToolbarLink
      href="https://github.com/vinayakkulkarni/nxui"
      label="GitHub"
      tip="GitHub"
    >
      <Icon name="simple-icons:github" class="size-4" />
    </DocsToolbarLink>
    <DocsToolbarButton
      label="Toggle theme"
      :tip="colorMode.value === 'dark' ? 'Light mode' : 'Dark mode'"
      @click="toggleColorMode"
    >
      <ClientOnly>
        <Icon
          :name="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'"
          class="size-4"
        />
        <template #fallback>
          <Icon name="lucide:moon" class="size-4" />
        </template>
      </ClientOnly>
      <template #tip>
        <ClientOnly>
          {{ colorMode.value === 'dark' ? 'Light mode' : 'Dark mode' }}
          <template #fallback>Dark mode</template>
        </ClientOnly>
      </template>
    </DocsToolbarButton>
    <DocsToolbarButton
      :label="showFps ? 'Hide FPS meter' : 'Show FPS meter'"
      :tip="showFps ? 'Hide FPS' : 'Show FPS'"
      :active="showFps"
      @click="toggleFps"
    >
      <Icon name="lucide:gauge" class="size-4" />
    </DocsToolbarButton>
  </div>
</template>
