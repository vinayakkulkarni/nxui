<template>
  <div class="relative min-h-svh flex flex-col bg-background">
    <!-- Subtle gradient overlay for depth -->
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/3 via-transparent to-transparent dark:from-violet-500/6"
    ></div>
    <DocsHeader />
    <div class="relative z-10 flex flex-1">
      <DocsSidebar />
      <main class="flex-1 w-full">
        <div class="max-w-4xl mx-auto px-6 md:px-8 py-10 md:py-16">
          <slot></slot>
        </div>
      </main>
      <DocsTableOfContents />
    </div>
  </div>
</template>
