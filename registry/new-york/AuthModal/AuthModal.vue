<script setup lang="ts">
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import AuthModalContent from './AuthModalContent.vue';

  const props = withDefaults(
    defineProps<{
      class?: string;
    }>(),
    { class: '' },
  );

  const open = defineModel<boolean>('open', { default: false });

  const emit = defineEmits<{
    login: [provider: string];
  }>();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeInOut', staggerChildren: 0.05 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeInOut' },
    },
  };
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <component
          :is="motion.div"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          class="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm dark:bg-zinc-950/40"
          @click="open = false"
        />
        <component
          :is="motion.div"
          :variants="containerVariants"
          initial="hidden"
          animate="show"
          exit="exit"
          :class="
            cn(
              'relative w-full max-w-90 overflow-hidden rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl ring-1 ring-zinc-950/5 dark:border-zinc-900 dark:bg-zinc-950',
              props.class,
            )
          "
        >
          <AuthModalContent
            @close="open = false"
            @login="emit('login', $event)"
          />
        </component>
      </div>
    </AnimatePresence>
  </Teleport>
</template>
