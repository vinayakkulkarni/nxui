<script setup lang="ts">
  import { ref, computed, useSlots } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      initialStep?: number;
      backButtonText?: string;
      nextButtonText?: string;
      disableStepIndicators?: boolean;
      class?: string;
    }>(),
    {
      initialStep: 1,
      backButtonText: 'Back',
      nextButtonText: 'Continue',
      disableStepIndicators: false,
      class: '',
    },
  );

  const emit = defineEmits<{
    stepChange: [step: number];
    finalStepCompleted: [];
  }>();

  const slots = useSlots();
  const currentStep = ref(props.initialStep);
  const direction = ref(0);

  const totalSteps = computed(() => {
    const s = slots.default?.();
    return s ? s.length : 0;
  });

  const isCompleted = computed(() => currentStep.value > totalSteps.value);
  const isLastStep = computed(() => currentStep.value === totalSteps.value);

  function updateStep(step: number) {
    currentStep.value = step;
    if (step > totalSteps.value) {
      emit('finalStepCompleted');
    } else {
      emit('stepChange', step);
    }
  }

  function handleBack() {
    if (currentStep.value > 1) {
      direction.value = -1;
      updateStep(currentStep.value - 1);
    }
  }

  function handleNext() {
    direction.value = 1;
    if (isLastStep.value) {
      updateStep(totalSteps.value + 1);
    } else {
      updateStep(currentStep.value + 1);
    }
  }

  function goToStep(step: number) {
    if (props.disableStepIndicators) return;
    direction.value = step > currentStep.value ? 1 : -1;
    updateStep(step);
  }

  function stepStatus(step: number) {
    if (currentStep.value === step) return 'active';
    return currentStep.value < step ? 'inactive' : 'complete';
  }
</script>

<template>
  <div
    :class="
      cn(
        'flex min-h-full flex-1 flex-col items-center justify-center p-4',
        $props.class,
      )
    "
  >
    <div
      class="mx-auto w-full max-w-md rounded-2xl border border-border shadow-xl"
    >
      <!-- Step indicators -->
      <div class="flex w-full items-center p-8">
        <template v-for="step in totalSteps" :key="step">
          <div
            class="relative cursor-pointer outline-none"
            @click="goToStep(step)"
          >
            <div
              class="flex size-8 items-center justify-center rounded-full font-semibold transition-all duration-300"
              :class="{
                'bg-primary text-primary-foreground':
                  stepStatus(step) === 'active' ||
                  stepStatus(step) === 'complete',
                'bg-neutral-200 text-muted-foreground dark:bg-muted':
                  stepStatus(step) === 'inactive',
              }"
            >
              <template v-if="stepStatus(step) === 'complete'">
                <svg
                  class="size-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </template>
              <template v-else-if="stepStatus(step) === 'active'">
                <div class="size-3 rounded-full bg-primary-foreground"></div>
              </template>
              <template v-else>
                <span class="text-sm">{{ step }}</span>
              </template>
            </div>
          </div>
          <div
            v-if="step < totalSteps"
            class="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-neutral-200 dark:bg-muted"
          >
            <div
              class="absolute inset-y-0 left-0 bg-primary transition-all duration-400"
              :style="{ width: currentStep > step ? '100%' : '0%' }"
            ></div>
          </div>
        </template>
      </div>

      <!-- Step content -->
      <div v-if="!isCompleted" class="relative overflow-hidden">
        <div class="px-8">
          <component :is="$slots.default?.()[currentStep - 1]" />
        </div>
      </div>

      <!-- Footer -->
      <div v-if="!isCompleted" class="px-8 pb-8">
        <div
          class="mt-10 flex"
          :class="currentStep !== 1 ? 'justify-between' : 'justify-end'"
        >
          <button
            v-if="currentStep !== 1"
            class="cursor-pointer rounded px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
            @click="handleBack"
          >
            {{ backButtonText }}
          </button>
          <button
            class="cursor-pointer rounded-full bg-primary px-3.5 py-1.5 font-medium tracking-tight text-primary-foreground transition-colors"
            @click="handleNext"
          >
            {{ isLastStep ? 'Complete' : nextButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
