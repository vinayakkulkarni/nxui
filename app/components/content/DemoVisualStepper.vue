<script setup lang="ts">
  import VisualStepper from '@registry/new-york/visual-stepper/VisualStepper.vue';

  const steps = [
    {
      title: 'Pick a Skill',
      description: 'Choose a curated style with built-in taste',
    },
    {
      title: 'Copy Skill Expression',
      description: 'Customize & copy the Skill for Codex',
    },
    {
      title: 'Prompt in Codex',
      description: 'Type the visual you want to create',
    },
    {
      title: 'Use Visual Asset',
      description: 'Polished app-ready icon or object is ready',
    },
  ];

  const gradients = [
    'from-emerald-400 via-cyan-300 to-amber-300',
    'from-fuchsia-400 via-purple-400 to-indigo-400',
    'from-amber-300 via-orange-400 to-rose-400',
    'from-sky-400 via-blue-500 to-violet-500',
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import VisualStepper from '~/components/ui/visual-stepper/VisualStepper.vue';

  const steps = [
    { title: 'Pick a Skill', description: 'Choose a curated style with built-in taste' },
    { title: 'Copy Skill Expression', description: 'Customize & copy the Skill for Codex' },
    { title: 'Prompt in Codex', description: 'Type the visual you want to create' },
    { title: 'Use Visual Asset', description: 'Polished app-ready icon or object is ready' },
  ];
</script>

<template>
  <VisualStepper :steps=&quot;steps&quot; :interval=&quot;2500&quot; autoplay>
    <template #card=&quot;{ index }&quot;>
      <!-- your preview content for each step -->
    </template>
  </VisualStepper>
</template>`"
  >
    <div class="flex h-100 w-full items-center justify-center rounded-lg p-8">
      <div class="w-full max-w-2xl">
        <VisualStepper :steps="steps" :interval="2500" autoplay>
          <template #card="{ index }">
            <div
              class="size-full bg-linear-to-br p-6"
              :class="gradients[index]"
            >
              <div
                class="flex size-full items-end rounded-2xl bg-white/20 p-4 backdrop-blur-sm"
              >
                <span class="text-sm font-semibold text-white drop-shadow">
                  {{ steps[index]?.title }}
                </span>
              </div>
            </div>
          </template>
        </VisualStepper>
      </div>
    </div>
  </ComponentDemo>
</template>
