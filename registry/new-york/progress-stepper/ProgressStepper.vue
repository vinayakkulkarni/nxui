<script setup lang="ts">
  import { computed } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { AnimatePresence, motion } from 'motion-v';
  import ProgressStepperMarker from './ProgressStepperMarker.vue';
  import type {
    ProgressStepStatus,
    ProgressStepperProps,
    ResolvedStep,
  } from './types';

  const props = withDefaults(defineProps<ProgressStepperProps>(), {
    align: 'right',
    showStepLabel: true,
    class: '',
  });

  /** Index of the active top-level step; `steps.length` means all done. */
  const current = defineModel<number>('current', { default: 0 });
  /** Index of the active sub-step inside the active step. */
  const currentChild = defineModel<number>('currentChild', { default: 0 });

  const reduced = usePreferredReducedMotion();

  const STATUS_TEXT: Record<ProgressStepStatus, string> = {
    complete: 'completed',
    active: 'in progress',
    pending: 'not started',
  };

  function statusFor(index: number, active: number): ProgressStepStatus {
    if (index < active) return 'complete';
    return index === active ? 'active' : 'pending';
  }

  const resolved = computed<ResolvedStep[]>(() =>
    props.steps.map((step, i) => {
      const status = step.status ?? statusFor(i, current.value);
      const children = (step.children ?? []).map((child, j) => ({
        ...child,
        status:
          child.status ??
          (status === 'active' ? statusFor(j, currentChild.value) : status),
      }));
      return { ...step, status, number: i + 1, children };
    }),
  );

  const isLeft = computed(() => props.align === 'left');

  function titleClass(status: ProgressStepStatus): string {
    if (status === 'active') return 'font-medium text-foreground';
    if (status === 'complete') return 'text-foreground/75';
    return 'text-muted-foreground/80';
  }

  function captionClass(status: ProgressStepStatus): string {
    return status === 'pending'
      ? 'text-muted-foreground/65'
      : 'text-muted-foreground';
  }

  const expand = computed(() =>
    reduced.value === 'reduce'
      ? { duration: 0 }
      : { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  );

  function childDelay(index: number): number {
    return reduced.value === 'reduce' ? 0 : 0.05 + index * 0.05;
  }
</script>

<template>
  <ol :class="['relative w-full max-w-md', props.class]">
    <!-- Main rail: runs through the centre of the top-level markers. -->
    <span
      aria-hidden="true"
      :class="[
        'absolute inset-y-1 w-px bg-border',
        isLeft ? 'left-3.25' : 'right-3.25',
      ]"
    />
    <li
      v-for="step in resolved"
      :key="step.id"
      :aria-current="step.status === 'active' ? 'step' : undefined"
      class="relative"
    >
      <div
        :class="[
          'flex items-center gap-3 py-3.5',
          isLeft ? 'flex-row-reverse' : '',
        ]"
      >
        <div :class="['min-w-0 flex-1', isLeft ? 'text-left' : 'text-right']">
          <p
            :class="[
              'text-lg/snug transition-colors duration-300',
              titleClass(step.status),
            ]"
          >
            <slot name="title" :step="step">{{ step.title }}</slot>
          </p>
          <p
            v-if="step.description || props.showStepLabel"
            :class="[
              'mt-1 text-xs transition-colors duration-300',
              captionClass(step.status),
            ]"
          >
            <slot name="description" :step="step">
              {{ step.description ?? `Step ${step.number}` }}
            </slot>
          </p>
          <span class="sr-only">, {{ STATUS_TEXT[step.status] }}</span>
        </div>
        <ProgressStepperMarker :status="step.status" />
      </div>

      <AnimatePresence :initial="false">
        <component
          :is="motion.div"
          v-if="step.children.length && step.status === 'active'"
          :key="`${step.id}-children`"
          :initial="{ height: 0, opacity: 0 }"
          :animate="{ height: 'auto', opacity: 1 }"
          :exit="{ height: 0, opacity: 0 }"
          :transition="expand"
          class="overflow-hidden"
        >
          <ol class="relative pb-2">
            <!-- Sub rail: links the sub-step markers. -->
            <span
              aria-hidden="true"
              :class="[
                'absolute inset-y-4.5 w-px bg-border',
                isLeft ? 'left-11.5' : 'right-11.5',
              ]"
            />
            <component
              :is="motion.li"
              v-for="(child, j) in step.children"
              :key="child.id"
              :initial="{ opacity: 0, y: -4 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ ...expand, delay: childDelay(j) }"
              :aria-current="child.status === 'active' ? 'step' : undefined"
              :class="[
                'relative flex h-9 items-center gap-2.5',
                isLeft ? 'flex-row-reverse' : '',
              ]"
            >
              <span
                :class="[
                  'min-w-0 flex-1 truncate text-[0.9375rem] transition-colors duration-300',
                  isLeft ? 'text-left' : 'text-right',
                  titleClass(child.status),
                  child.status === 'active' ? 'font-normal' : '',
                ]"
              >
                {{ child.title }}
                <span class="sr-only">, {{ STATUS_TEXT[child.status] }}</span>
              </span>
              <ProgressStepperMarker :status="child.status" size="sm" />
              <span aria-hidden="true" class="w-7 shrink-0" />
            </component>
          </ol>
        </component>
      </AnimatePresence>
    </li>
  </ol>
</template>
