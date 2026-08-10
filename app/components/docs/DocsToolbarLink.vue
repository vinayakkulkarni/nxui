<script setup lang="ts">
  import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
  import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
  import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

  defineProps<{
    href: string;
    label: string;
    tip: string;
  }>();
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <a
        :href="href"
        target="_blank"
        rel="noopener noreferrer"
        class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
      >
        <slot />
        <span class="sr-only">{{ label }}</span>
      </a>
    </TooltipTrigger>
    <TooltipContent>{{ tip }}</TooltipContent>
  </Tooltip>
</template>
