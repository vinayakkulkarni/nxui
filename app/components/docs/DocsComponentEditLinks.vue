<script setup lang="ts">
  const route = useRoute();

  const editUrl = computed(() => {
    const slug = route.path.split('/').pop();
    const category = route.path.split('/')[2];
    return `https://github.com/vinayakkulkarni/nxui/edit/main/content/docs/${category}/${slug}.md`;
  });

  const issueUrl = computed(() => {
    const slug = route.path.split('/').pop();
    const component = slug
      ? slug
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ')
      : '';
    return `https://github.com/vinayakkulkarni/nxui/issues/new?template=bug_report.yml&labels=bug,triage&title=${encodeURIComponent(`[Bug]: ${component} - `)}`;
  });
</script>

<template>
  <div
    class="flex items-center justify-center gap-1.5 text-xs lg:gap-2 lg:text-sm"
  >
    <div class="h-px flex-1 bg-border/50"></div>
    <a
      :href="editUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/50 px-2 py-1 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary lg:gap-1.5 lg:px-3 lg:py-1.5"
    >
      <Icon name="lucide:pencil" class="size-3 lg:size-3.5" />
      Edit
    </a>
    <a
      :href="issueUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/50 px-2 py-1 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary lg:gap-1.5 lg:px-3 lg:py-1.5"
    >
      <Icon name="lucide:circle-dot" class="size-3 lg:size-3.5" />
      Report
    </a>
    <div class="h-px flex-1 bg-border/50"></div>
  </div>
</template>
