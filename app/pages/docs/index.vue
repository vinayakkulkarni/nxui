<script setup lang="ts">
  definePageMeta({
    layout: 'docs',
  });

  useHead({
    title: 'Introduction - nxui',
  });
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">
        Components that feel like they belong
      </h1>
      <p class="mt-2 text-lg text-muted-foreground">
        Handcrafted Vue components built with Tailwind CSS and motion-v. No npm
        install — just copy the code and make it yours.
      </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-3">
      <div class="rounded-lg border p-6">
        <div class="mb-2 text-sm font-medium text-muted-foreground">01</div>
        <h3 class="mb-1 font-semibold">Run the CLI</h3>
        <p class="text-sm text-muted-foreground">
          Use the install command to add dependencies automatically.
        </p>
      </div>
      <div class="rounded-lg border p-6">
        <div class="mb-2 text-sm font-medium text-muted-foreground">02</div>
        <h3 class="mb-1 font-semibold">Copy the snippet</h3>
        <p class="text-sm text-muted-foreground">
          Grab the component code with one click.
        </p>
      </div>
      <div class="rounded-lg border p-6">
        <div class="mb-2 text-sm font-medium text-muted-foreground">03</div>
        <h3 class="mb-1 font-semibold">Make it yours</h3>
        <p class="text-sm text-muted-foreground">
          Customize colors, sizes, and animations to match your brand.
        </p>
      </div>
    </div>

    <div>
      <NuxtLink to="/docs/components/hyper-text">
        <UiButton>
          Start with your first component
          <Icon name="lucide:arrow-right" class="ml-2 size-4" />
        </UiButton>
      </NuxtLink>
    </div>
  </div>
</template>
