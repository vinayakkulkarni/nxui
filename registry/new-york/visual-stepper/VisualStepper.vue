<script setup lang="ts">
  // Visual stepper interaction: a vertical step list whose connector bar
  // grows for the active step while a preview card crossfades per step.
  // Inspired by the "visual stepper interaction" by @nitishkmrk.
  import { ref, computed, onBeforeUnmount, watch } from 'vue';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';
  import type { VisualStepperProps } from './types';

  const props = withDefaults(defineProps<VisualStepperProps>(), {
    autoplay: true,
    interval: 2500,
    pauseOnHover: true,
    showCard: true,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
  }>();

  const active = defineModel<number>({ default: 0 });
  const paused = ref(false);

  const count = computed(() => props.steps.length);

  function goTo(index: number) {
    active.value = ((index % count.value) + count.value) % count.value;
    emit('change', active.value);
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  function start() {
    stop();
    if (!props.autoplay || count.value < 2) return;
    timer = setInterval(() => {
      if (!paused.value) goTo(active.value + 1);
    }, props.interval);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  watch(
    [() => props.autoplay, () => props.interval, () => count.value],
    () => start(),
    { immediate: true },
  );
  onBeforeUnmount(() => stop());

  function stateOf(index: number): 'done' | 'active' | 'upcoming' {
    if (index === active.value) return 'active';
    return index < active.value ? 'done' : 'upcoming';
  }
</script>

<template>
  <div
    :class="cn('flex w-full items-center gap-10', props.class)"
    @mouseenter="paused = pauseOnHover"
    @mouseleave="paused = false"
  >
    <!-- Preview card: crossfades per step -->
    <div
      v-if="showCard"
      class="relative hidden aspect-square w-2/5 shrink-0 overflow-hidden rounded-3xl border border-border bg-muted/40 sm:block"
    >
      <AnimatePresence mode="wait">
        <component
          :is="motion.div"
          :key="active"
          class="absolute inset-0"
          :initial="{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }"
          :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }"
          :transition="{ duration: 0.45, ease: 'easeOut' }"
        >
          <slot name="card" :index="active" :step="steps[active]">
            <div
              class="flex size-full items-center justify-center font-display text-7xl font-bold text-foreground/10"
            >
              {{ active + 1 }}
            </div>
          </slot>
        </component>
      </AnimatePresence>
    </div>

    <!-- Step list -->
    <div class="flex min-w-0 flex-1 flex-col gap-7">
      <button
        v-for="(step, i) in steps"
        :key="step.title"
        type="button"
        class="group flex cursor-pointer items-start gap-4 text-left"
        :aria-current="stateOf(i) === 'active' ? 'step' : undefined"
        @click="goTo(i)"
      >
        <!-- Connector: short gray dash -> tall black bar when active -->
        <span class="flex w-1 shrink-0 flex-col items-center pt-1">
          <component
            :is="motion.span"
            class="w-0.75 rounded-full"
            :initial="false"
            :animate="{
              height: stateOf(i) === 'active' ? 40 : 16,
              backgroundColor:
                stateOf(i) === 'upcoming'
                  ? 'var(--border)'
                  : 'var(--foreground)',
            }"
            :transition="{ type: 'spring', stiffness: 400, damping: 32 }"
          />
        </span>

        <span class="flex min-w-0 flex-col gap-1">
          <component
            :is="motion.span"
            class="text-lg/tight font-semibold sm:text-xl"
            :initial="false"
            :animate="{
              color:
                stateOf(i) === 'upcoming'
                  ? 'var(--muted-foreground)'
                  : 'var(--foreground)',
            }"
            :transition="{ duration: 0.3 }"
          >
            {{ step.title }}
          </component>
          <span
            v-if="step.description"
            class="text-sm text-muted-foreground sm:text-base"
          >
            {{ step.description }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
