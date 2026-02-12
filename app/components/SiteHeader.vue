<script setup lang="ts">
  const colorMode = useColorMode();
  const route = useRoute();

  const isDocs = computed(() => route.path.startsWith('/docs'));

  function toggleColorMode() {
    colorMode.preference =
      colorMode.preference === 'dark' ? 'light' : 'dark';
  }
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-14 items-center px-4">
      <NuxtLink to="/" class="mr-6 flex items-center space-x-2 font-bold">
        NXUI
      </NuxtLink>

      <nav class="hidden items-center gap-6 text-sm md:flex">
        <NuxtLink
          to="/docs"
          class="text-muted-foreground transition-colors hover:text-foreground"
          :class="{ 'text-foreground': isDocs }"
        >
          Docs
        </NuxtLink>
        <a
          href="https://github.com/vinayakkulkarni/nxui"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </nav>

      <div class="flex flex-1 items-center justify-end gap-2">
        <SiteSearch />

        <button
          class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          @click="toggleColorMode"
        >
          <Icon
            :name="
              colorMode.preference === 'dark' ? 'lucide:sun' : 'lucide:moon'
            "
            class="size-4"
          />
        </button>

        <a
          href="https://github.com/vinayakkulkarni/nxui"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:inline-flex"
        >
          <Icon name="simple-icons:github" class="size-4" />
        </a>

        <SiteMobileNav class="md:hidden" />
      </div>
    </div>
  </header>
</template>
