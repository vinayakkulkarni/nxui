<script setup lang="ts">
  import { ref } from 'vue';
  import ModelPicker from '@registry/new-york/model-picker/ModelPicker.vue';
  import type {
    ModelPickerEffortLevel,
    ModelPickerModel,
  } from '@registry/new-york/model-picker/types';

  const models: ModelPickerModel[] = [
    {
      id: 'opus',
      name: 'Opus 5.5',
      tagline: 'Hardest problems',
      speed: 2,
      quality: 5,
      cost: 5,
      latency: 2.1,
      price: 25,
    },
    {
      id: 'sonnet',
      name: 'Sonnet 5.5',
      tagline: 'Everyday work',
      speed: 4,
      quality: 4,
      cost: 3,
      latency: 0.9,
      price: 15,
    },
    {
      id: 'haiku',
      name: 'Haiku 5.5',
      tagline: 'Quick and light',
      speed: 5,
      quality: 3,
      cost: 1,
      latency: 0.4,
      price: 4,
    },
  ];

  const model = ref('sonnet');
  const thinking = ref(false);
  const effort = ref<ModelPickerEffortLevel>('medium');
  const webSearch = ref(false);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import ModelPicker from '~/components/ui/model-picker/ModelPicker.vue';
  import type {
    ModelPickerEffortLevel,
    ModelPickerModel,
  } from '~/components/ui/model-picker/types';

  const models: ModelPickerModel[] = [
    { id: 'opus', name: 'Opus 5.5', tagline: 'Hardest problems', speed: 2, quality: 5, cost: 5, latency: 2.1, price: 25 },
    { id: 'sonnet', name: 'Sonnet 5.5', tagline: 'Everyday work', speed: 4, quality: 4, cost: 3, latency: 0.9, price: 15 },
    { id: 'haiku', name: 'Haiku 5.5', tagline: 'Quick and light', speed: 5, quality: 3, cost: 1, latency: 0.4, price: 4 },
  ];

  const model = ref('sonnet');
  const thinking = ref(false);
  const effort = ref<ModelPickerEffortLevel>('medium');
  const webSearch = ref(false);
</script>

<template>
  <ModelPicker
    v-model=&quot;model&quot;
    v-model:thinking=&quot;thinking&quot;
    v-model:effort=&quot;effort&quot;
    v-model:web-search=&quot;webSearch&quot;
    :models=&quot;models&quot;
    autoplay
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="flex w-full justify-center pb-112">
        <ModelPicker
          v-model="model"
          v-model:thinking="thinking"
          v-model:effort="effort"
          v-model:web-search="webSearch"
          :models="models"
          autoplay
        />
      </div>
    </div>
  </ComponentDemo>
</template>
