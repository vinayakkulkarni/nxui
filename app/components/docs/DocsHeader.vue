<script setup lang="ts"></script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.06]"
  >
    <div class="flex h-16 items-center justify-between px-4 md:px-6">
      <div class="flex items-center gap-4 md:gap-6">
        <DocsMobileNav />
        <NuxtLink
          to="/docs"
          class="hidden md:flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div
            class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20"
          >
            <Icon name="lucide:component" class="size-4 text-white" />
          </div>
          <span
            class="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold tracking-tight text-transparent"
          >
            NXUI
          </span>
        </NuxtLink>
      </div>

      <div class="flex items-center gap-1.5">
        <DocsCommandMenu />
        <div class="hidden md:flex items-center">
          <DocsGitHubStarButton />
        </div>
        <DocsThemeToggle />
      </div>
    </div>
  </header>
</template>
