<script setup lang="ts">
  import { reactive } from 'vue';
  import AnnotatedText from '@registry/new-york/annotated-text/AnnotatedText.vue';
  import { annotationVariants } from '@registry/new-york/annotated-text/annotation-marks.ts';
  import type { Pane } from 'tweakpane';

  const params = reactive({
    animate: true,
    duration: 0.65,
    stagger: 0.08,
  });

  function onPaneCreated(pane: Pane) {
    pane.addBinding(params, 'animate');
    pane.addBinding(params, 'duration', { min: 0.1, max: 2, step: 0.05 });
    pane.addBinding(params, 'stagger', { min: 0, max: 0.3, step: 0.01 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import AnnotatedText from '~/components/ui/annotated-text/AnnotatedText.vue';
</script>

<template>
  <div class=&quot;grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-7 text-base sm:gap-x-16 sm:gap-y-12 sm:text-xl&quot;>
    <AnnotatedText variant=&quot;wavy&quot; :delay=&quot;0&quot;>wavy</AnnotatedText>
    <AnnotatedText variant=&quot;underline&quot; :delay=&quot;0.08&quot;>underline</AnnotatedText>
    <AnnotatedText variant=&quot;doubleUnderline&quot; :delay=&quot;0.16&quot;>doubleUnderline</AnnotatedText>
    <AnnotatedText variant=&quot;dottedUnderline&quot; :delay=&quot;0.24&quot;>dottedUnderline</AnnotatedText>
    <AnnotatedText variant=&quot;line&quot; :delay=&quot;0.32&quot;>line</AnnotatedText>
    <AnnotatedText variant=&quot;arrow&quot; :delay=&quot;0.4&quot;>arrow</AnnotatedText>
    <AnnotatedText variant=&quot;highlight&quot; :delay=&quot;0.48&quot;>highlight</AnnotatedText>
    <AnnotatedText variant=&quot;circle&quot; :delay=&quot;0.56&quot;>circle</AnnotatedText>
    <AnnotatedText variant=&quot;box&quot; :delay=&quot;0.64&quot;>box</AnnotatedText>
    <AnnotatedText variant=&quot;bracket&quot; :delay=&quot;0.72&quot;>bracket</AnnotatedText>
    <AnnotatedText variant=&quot;strikethrough&quot; :delay=&quot;0.8&quot;>strikethrough</AnnotatedText>
    <AnnotatedText variant=&quot;crossOut&quot; :delay=&quot;0.88&quot;>crossOut</AnnotatedText>
  </div>
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 items-center justify-center p-6"
    >
      <div
        class="grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-7 text-base text-foreground sm:gap-x-16 sm:gap-y-12 sm:text-xl"
      >
        <AnnotatedText
          v-for="(variant, index) in annotationVariants"
          :key="variant"
          :variant="variant"
          :animate="params.animate"
          :duration="params.duration"
          :delay="index * params.stagger"
        >
          {{ variant }}
        </AnnotatedText>
      </div>
      <ShaderPane title="Annotated Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
