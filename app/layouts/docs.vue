<script setup lang="ts">
  const navigation = useNavigation();
  const route = useRoute();
</script>

<template>
  <div class="relative flex min-h-screen flex-col">
    <SiteHeader />
    <div class="container flex-1 px-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside class="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <UiScrollArea class="h-full py-6 pr-6 lg:py-8">
          <nav>
            <div
              v-for="group in navigation"
              :key="group.title"
              class="mb-4"
            >
              <h4 class="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                {{ group.title }}
              </h4>
              <div class="space-y-0.5">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.href"
                  :to="item.href"
                  class="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  :class="{
                    'bg-muted font-medium text-foreground':
                      route.path === item.href,
                  }"
                >
                  {{ item.title }}
                </NuxtLink>
              </div>
            </div>
          </nav>
        </UiScrollArea>
      </aside>
      <main class="relative py-6 lg:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
