<template>
  <div
    class="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-4 backdrop-blur-sm dark:border-white/6 dark:bg-white/2"
  >
    <div class="space-y-1">
      <h3 class="text-sm font-medium tracking-tight text-foreground">
        Need custom components?
      </h3>
      <p class="text-xs/relaxed text-muted-foreground">
        Get bespoke UI components &amp; stunning websites tailored for your
        brand.
      </p>
    </div>
    <NuxtLink
      to="https://vinayakkulkarni.dev"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30"
    >
      Get in touch
      <Icon
        name="lucide:arrow-right"
        class="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
      />
    </NuxtLink>
    <NuxtLink
      to="https://github.com/sponsors/vinayakkulkarni"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/50 dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8"
    >
      <Icon
        name="lucide:heart"
        class="size-3 text-pink-500 transition-transform group-hover:scale-110"
      />
      Sponsor
    </NuxtLink>
  </div>
</template>
