<script setup lang="ts">
  import type { FoldTextSegmentProps } from './types';

  withDefaults(defineProps<FoldTextSegmentProps>(), { line: false });

  // Hoisted so re-renders never patch the inline opacity the animation owns.
  const FOLDED_STYLE = { opacity: 0 };
</script>

<template>
  <span class="fold-text-segment" :data-fold-split="line ? 'line' : undefined">
    <span
      v-if="foldStyle === 'blinds'"
      class="fold-text-piece"
      :data-fold-hinge="hinge"
      data-fold-style="blinds"
      :style="folded ? FOLDED_STYLE : undefined"
    >
      <span class="fold-text-slat" :data-fold-text="content">{{
        content
      }}</span>
      <span
        class="fold-text-slat"
        data-fold-slat="b"
        :data-fold-text="content"
        >{{ content }}</span
      >
    </span>
    <span
      v-else
      class="fold-text-piece"
      :data-fold-hinge="hinge"
      :data-fold-style="foldStyle"
      :data-fold-text="content"
      :style="folded ? FOLDED_STYLE : undefined"
      >{{ content }}</span
    >
  </span>
</template>

<style scoped>
  .fold-text-segment {
    display: inline-block;
    perspective: var(--fold-perspective, 700px);
    vertical-align: baseline;
  }

  .fold-text-segment[data-fold-split='line'] {
    display: block;
  }

  .fold-text-piece {
    --fold-shade: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.58) 0%,
      rgba(0, 0, 0, 0.22) 42%,
      rgba(255, 255, 255, 0.26) 100%
    );
    position: relative;
    display: inline-block;
    backface-visibility: hidden;
    transform-origin: 50% 0%;
  }

  .fold-text-piece[data-fold-hinge='bottom'] {
    --fold-shade: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.58) 0%,
      rgba(0, 0, 0, 0.22) 42%,
      rgba(255, 255, 255, 0.26) 100%
    );
    transform-origin: 50% 100%;
  }

  .fold-text-piece[data-fold-hinge='left'] {
    --fold-shade: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.58) 0%,
      rgba(0, 0, 0, 0.22) 42%,
      rgba(255, 255, 255, 0.26) 100%
    );
    transform-origin: 0% 50%;
  }

  .fold-text-piece[data-fold-hinge='right'] {
    --fold-shade: linear-gradient(
      270deg,
      rgba(0, 0, 0, 0.58) 0%,
      rgba(0, 0, 0, 0.22) 42%,
      rgba(255, 255, 255, 0.26) 100%
    );
    transform-origin: 100% 50%;
  }

  .fold-text-piece[data-fold-style='blinds'] {
    perspective: var(--fold-perspective, 700px);
  }

  .fold-text-slat {
    position: relative;
    display: inline-block;
    backface-visibility: hidden;
  }

  .fold-text-slat[data-fold-slat='b'] {
    position: absolute;
    inset: 0;
    visibility: hidden;
  }

  .fold-text-piece::after,
  .fold-text-slat::after {
    content: attr(data-fold-text);
    position: absolute;
    inset: 0;
    pointer-events: none;
    color: transparent;
    -webkit-text-fill-color: transparent;
    background-image: var(--fold-shade);
    -webkit-background-clip: text;
    background-clip: text;
    opacity: var(--fold-crease, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    .fold-text-piece,
    .fold-text-slat {
      transform: none !important;
    }

    .fold-text-piece::after,
    .fold-text-slat::after {
      opacity: 0 !important;
    }
  }
</style>
