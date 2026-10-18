<script setup lang="ts">
  import type { HoldButtonLabelsProps } from './types';

  defineProps<HoldButtonLabelsProps>();
</script>

<template>
  <span :class="['hold-button__label', fill && 'hold-button__label--fill']">
    <span class="hold-button__idle" :aria-hidden="phase === 'done'">
      <span v-if="icon || $slots.icon" class="hold-button__icon">
        <slot name="icon">
          <Icon :name="icon ?? ''" class="size-4.5" />
        </slot>
      </span>
      <slot />
    </span>
    <span class="hold-button__done" :aria-hidden="phase !== 'done'">
      <span v-if="doneIcon || $slots['done-icon']" class="hold-button__icon">
        <slot name="done-icon">
          <Icon :name="doneIcon ?? ''" class="size-4.5" />
        </slot>
      </span>
      <slot name="done">{{ doneLabel }}</slot>
    </span>
  </span>
</template>
