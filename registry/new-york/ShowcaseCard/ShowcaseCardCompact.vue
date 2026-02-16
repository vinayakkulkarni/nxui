<script setup lang="ts">
import { useElementHover } from '@vueuse/core';
import { motion } from 'motion-v';
import type { ShowcaseCardCompactProps } from '~/types/components';
import { cn } from '~/lib/utils';

const props = withDefaults(defineProps<ShowcaseCardCompactProps>(), {
  imageAlt: 'Showcase image',
  class: '',
});

const emit = defineEmits<{ (e: 'click'): void }>();

const cardRef = ref<HTMLElement>();
const isHovered = useElementHover(cardRef);
</script>

<template>
  <div
    ref="cardRef"
    :class="cn(
      'relative w-full rounded-2xl overflow-hidden cursor-pointer',
      'bg-white dark:bg-neutral-900',
      'shadow-lg shadow-black/10',
      'transition-transform duration-300',
      isHovered && '-translate-y-1 scale-[1.02]',
      props.class,
    )"
    @click="emit('click')"
  >
    <div class="relative aspect-[16/10] overflow-hidden">
      <img
        :src="imageUrl"
        :alt="imageAlt"
        class="w-full h-full object-cover transition-transform duration-400 ease-out"
        :style="{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-900 via-transparent to-transparent opacity-80" />
    </div>
    <div class="p-4 -mt-6 relative z-10">
      <h3 class="text-lg font-medium text-neutral-900 dark:text-white mb-1 line-clamp-2">{{ heading }}</h3>
      <p v-if="description" class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{{ description }}</p>
    </div>
    <component
      :is="motion.div"
      class="absolute bottom-4 right-4"
      :initial="{ opacity: 0, x: -10 }"
      :animate="{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }"
      :transition="{ duration: 0.2 }"
    >
      <Icon name="lucide:arrow-up-right" class="w-5 h-5 text-neutral-400" />
    </component>
  </div>
</template>
