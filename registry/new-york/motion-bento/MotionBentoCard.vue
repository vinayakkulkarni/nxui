<script setup lang="ts">
  import { computed } from 'vue';
  import MotionBentoCommerce from './MotionBentoCommerce.vue';
  import MotionBentoDesign from './MotionBentoDesign.vue';
  import MotionBentoHosting from './MotionBentoHosting.vue';
  import MotionBentoIntegrations from './MotionBentoIntegrations.vue';
  import MotionBentoSla from './MotionBentoSla.vue';
  import type { MotionBentoCardProps } from './types';

  const props = defineProps<MotionBentoCardProps>();

  const ART = {
    commerce: MotionBentoCommerce,
    sla: MotionBentoSla,
    integrations: MotionBentoIntegrations,
    design: MotionBentoDesign,
    hosting: MotionBentoHosting,
  };

  const artComponent = computed(() =>
    props.item.art ? ART[props.item.art] : null,
  );
</script>

<template>
  <article
    class="flex flex-col rounded-[1.375rem] bg-card p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(15_40_80/0.18)] ring-1 ring-border/70 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_2px_4px_rgb(0_0_0/0.05),0_28px_48px_-20px_rgb(15_40_80/0.32)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.7)]"
  >
    <div
      class="relative h-56 overflow-hidden rounded-2xl bg-(image:--mb-art)"
      aria-hidden="true"
    >
      <slot>
        <component
          :is="artComponent"
          v-if="artComponent"
          :playing="playing"
          :still="still"
        />
      </slot>
    </div>
    <div class="px-4 pt-4 pb-3.5">
      <h3 class="text-lg/snug font-medium text-foreground/80">
        {{ item.title }}
      </h3>
      <p
        v-if="item.description"
        class="mt-1.5 text-sm/snug text-muted-foreground"
      >
        {{ item.description }}
      </p>
    </div>
  </article>
</template>
