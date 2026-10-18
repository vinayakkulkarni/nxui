<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useElementHover, useIntervalFn } from '@vueuse/core';
  import ProgressStepper from '@registry/new-york/progress-stepper/ProgressStepper.vue';
  import type { ProgressStep } from '@registry/new-york/progress-stepper/types';
  import { Button } from '~/components/ui/button';

  const steps: ProgressStep[] = [
    { id: 'plan', title: 'Resolution Planning' },
    { id: 'scope', title: 'Scope Alignment' },
    {
      id: 'implement',
      title: 'Implementation',
      children: [
        { id: 'configure', title: 'Configure Solution' },
        { id: 'connect', title: 'Connect Systems' },
        { id: 'apply', title: 'Apply Changes' },
        { id: 'run', title: 'Run Workflow' },
        { id: 'prepare', title: 'Prepare Output' },
      ],
    },
    { id: 'verify', title: 'Outcome Verification' },
    { id: 'summary', title: 'Final Summary' },
  ];

  // Starts on the reference frame: Implementation → Apply Changes.
  const current = ref(2);
  const currentChild = ref(2);

  const childCount = (index: number): number =>
    steps[index]?.children?.length ?? 0;

  const done = computed(() => current.value >= steps.length);

  function next(): void {
    if (done.value) return;
    if (currentChild.value < childCount(current.value) - 1) {
      currentChild.value += 1;
      return;
    }
    current.value += 1;
    currentChild.value = 0;
  }

  function back(): void {
    if (currentChild.value > 0) {
      currentChild.value -= 1;
      return;
    }
    if (current.value === 0) return;
    current.value -= 1;
    currentChild.value = Math.max(childCount(current.value) - 1, 0);
  }

  function replay(): void {
    current.value = 0;
    currentChild.value = 0;
  }

  const panel = ref<HTMLElement | null>(null);
  const hovered = useElementHover(panel);

  useIntervalFn(() => {
    if (!hovered.value && !done.value) next();
  }, 1600);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ProgressStepper from '~/components/ui/progress-stepper/ProgressStepper.vue';
  import type { ProgressStep } from '~/components/ui/progress-stepper/types';

  const steps: ProgressStep[] = [
    { id: 'plan', title: 'Resolution Planning' },
    { id: 'scope', title: 'Scope Alignment' },
    {
      id: 'implement',
      title: 'Implementation',
      children: [
        { id: 'configure', title: 'Configure Solution' },
        { id: 'connect', title: 'Connect Systems' },
        { id: 'apply', title: 'Apply Changes' },
        { id: 'run', title: 'Run Workflow' },
        { id: 'prepare', title: 'Prepare Output' },
      ],
    },
    { id: 'verify', title: 'Outcome Verification' },
    { id: 'summary', title: 'Final Summary' },
  ];

  const current = ref(2);
  const currentChild = ref(2);
</script>

<template>
  <ProgressStepper
    v-model:current=&quot;current&quot;
    v-model:current-child=&quot;currentChild&quot;
    :steps=&quot;steps&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div ref="panel" class="flex w-full max-w-md flex-col items-center gap-8">
        <ProgressStepper
          v-model:current="current"
          v-model:current-child="currentChild"
          :steps="steps"
        />
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="back">Back</Button>
          <Button variant="outline" size="sm" :disabled="done" @click="next">
            Next
          </Button>
          <Button variant="ghost" size="sm" @click="replay">Replay</Button>
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
