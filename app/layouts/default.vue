<template>
  <div class="relative flex min-h-screen flex-col">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <footer class="border-t py-6">
      <div class="container flex flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
        <p class="text-sm text-muted-foreground">
          Built by
          <a
            href="https://vinayakkulkarni.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-4"
          >
            Vinayak Kulkarni
          </a>
        </p>
        <p class="text-sm text-muted-foreground">
          Inspired by
          <a
            href="https://componentry.fun"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-4"
          >
            componentry.fun
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
