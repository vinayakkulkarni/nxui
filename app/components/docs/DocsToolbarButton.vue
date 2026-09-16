<script setup lang="ts">
  import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
  import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
  import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

  const props = withDefaults(
    defineProps<{
      label: string;
      tip: string;
      active?: boolean;
    }>(),
    { active: undefined },
  );

  const emit = defineEmits<{
    click: [e: MouseEvent];
  }>();
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <button
        type="button"
        :aria-label="props.label"
        :aria-pressed="props.active"
        class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm transition-colors"
        :class="
          props.active
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="emit('click', $event)"
      >
        <slot />
      </button>
    </TooltipTrigger>
    <TooltipContent>
      <slot name="tip">{{ tip }}</slot>
    </TooltipContent>
  </Tooltip>
</template>
