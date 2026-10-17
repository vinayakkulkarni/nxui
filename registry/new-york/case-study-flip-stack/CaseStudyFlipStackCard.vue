<script setup lang="ts">
  import { computed } from 'vue';
  import { caseStudyFlipFrame } from './case-study-flip-stack';
  import type { CaseStudyFlipStackCardProps } from './types';

  const props = defineProps<CaseStudyFlipStackCardProps>();

  const frame = computed(() =>
    caseStudyFlipFrame(
      props.progress,
      props.index,
      props.total,
      props.reduceMotion,
    ),
  );

  const label = computed(
    () => props.item.number ?? String(props.index + 1).padStart(2, '0'),
  );

  const articleStyle = computed(() => ({
    transform: frame.value.transform,
    opacity: frame.value.opacity,
    zIndex: props.total - props.index,
  }));

  const cardStyle = computed(() => ({
    backgroundColor: props.item.background,
    color: props.item.foreground ?? 'white',
    transform: frame.value.innerTransform,
  }));
</script>

<template>
  <article
    class="absolute inset-x-0 top-0 aspect-3/4 origin-center transform-3d backface-hidden will-change-transform @2xl:aspect-[1.76/1]"
    :style="articleStyle"
    :aria-label="`${label} — ${item.eyebrow}`"
  >
    <div
      class="grid h-full origin-bottom overflow-hidden rounded-[clamp(18px,2cqw,30px)] shadow-[0_16px_50px_rgba(20,17,10,0.18)] @2xl:grid-cols-[1.15fr_0.85fr]"
      :style="cardStyle"
    >
      <div
        class="flex min-w-0 flex-col p-[clamp(24px,3cqw,48px)] @3xl:pr-[clamp(22px,3cqw,48px)]"
      >
        <div class="flex items-start">
          <span
            class="text-[clamp(24px,2.5cqw,36px)] leading-none font-medium tracking-[-0.06em]"
          >
            {{ label }}
          </span>
        </div>

        <div class="mt-auto max-w-184 pt-8">
          <p
            class="mb-[clamp(10px,1.5cqw,22px)] text-[10px] font-semibold tracking-[0.16em] uppercase opacity-70 @2xl:text-xs"
          >
            {{ item.eyebrow }}
          </p>
          <h2
            class="max-w-[16ch] text-[clamp(28px,3.25cqw,48px)] leading-[0.96] font-semibold tracking-tighter text-balance"
          >
            {{ item.title }}
          </h2>
          <p
            class="mt-[clamp(16px,1.8cqw,24px)] max-w-2xl text-[clamp(13px,1.1cqw,16px)] leading-normal opacity-82"
          >
            {{ item.description }}
          </p>
        </div>
      </div>

      <div
        class="relative m-[clamp(10px,1.2cqw,18px)] min-h-45 overflow-hidden rounded-[clamp(12px,1.4cqw,22px)] @2xl:ml-0"
      >
        <img
          :src="item.image"
          :alt="item.imageAlt"
          class="size-full object-cover"
          :loading="index < 2 ? 'eager' : 'lazy'"
          draggable="false"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/10"
        />
      </div>
    </div>
  </article>
</template>
