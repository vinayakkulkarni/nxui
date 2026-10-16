<script setup lang="ts">
  import { onMounted, useTemplateRef } from 'vue';
  import type { NodeCanvasNoteProps } from './types';

  const props = withDefaults(defineProps<NodeCanvasNoteProps>(), {
    editable: false,
    autofocus: false,
    placeholder: 'Type a note…',
    class: '',
  });

  const text = defineModel<string>('text', { default: '' });

  const field = useTemplateRef<HTMLTextAreaElement>('field');

  onMounted(() => {
    if (props.editable && props.autofocus) field.value?.focus();
  });

  function onInput(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      text.value = event.target.value;
    }
  }
</script>

<template>
  <div
    :class="[
      'size-full rounded-xl bg-[#f5d03b] px-3.5 py-3 text-sm/snug font-medium text-neutral-900 shadow-[0_8px_20px_rgb(0_0_0/0.25)]',
      props.class,
    ]"
  >
    <textarea
      v-if="props.editable"
      ref="field"
      :value="text"
      :placeholder="props.placeholder"
      aria-label="Note text"
      class="size-full resize-none bg-transparent outline-none placeholder:text-neutral-900/50"
      @input="onInput"
    />
    <p v-else>{{ text }}</p>
  </div>
</template>
