<template>
  <div class="relative h-dvh overflow-hidden bg-background">
    <!-- Subtle gradient overlay for depth -->
    <div
      class="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/3 via-transparent to-transparent dark:from-violet-500/6"
    ></div>
    <DocsFloatingToolbar />
    <div class="relative z-10 h-full">
      <slot></slot>
    </div>
  </div>
</template>
