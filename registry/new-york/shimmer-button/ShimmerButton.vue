<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      shimmerColor?: string;
      shimmerSize?: string;
      shimmerDuration?: string;
      borderRadius?: string;
      background?: string;
      class?: string;
    }>(),
    {
      shimmerColor: '#ffffff',
      shimmerSize: '0.05em',
      shimmerDuration: '3s',
      borderRadius: '100px',
      background: 'rgba(0, 0, 0, 1)',
      class: '',
    },
  );

  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === 'dark');

  const resolvedBg = computed(() => {
    if (props.background !== 'rgba(0, 0, 0, 1)') return props.background;
    return isDark.value ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
  });

  const resolvedShimmerColor = computed(() => {
    if (props.shimmerColor !== '#ffffff') return props.shimmerColor;
    return isDark.value ? '#000000' : '#ffffff';
  });
</script>

<template>
  <button
    :class="
      cn(
        'group relative z-0 inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-sm font-medium text-white [background:var(--bg)] [border-radius:var(--radius)] transition-transform duration-300 ease-in-out active:translate-y-px dark:border-black/10 dark:text-black',
        $props.class,
      )
    "
    :style="{
      '--spread': '90deg',
      '--shimmer-color': resolvedShimmerColor,
      '--radius': borderRadius,
      '--speed': shimmerDuration,
      '--cut': shimmerSize,
      '--bg': resolvedBg,
    }"
  >
    <!-- spark container -->
    <span
      class="absolute inset-0 -z-30 overflow-visible blur-[2px] [container-type:size]"
    >
      <!-- spark -->
      <span
        class="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]"
      >
        <!-- spark gradient -->
        <span
          class="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"
        ></span>
      </span>
    </span>

    <!-- content -->
    <span class="relative z-10 flex items-center gap-2">
      <slot>Shimmer Button</slot>
    </span>

    <!-- highlight -->
    <span
      class="absolute inset-0 size-full rounded-2xl px-4 py-1.5 shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f] dark:shadow-[inset_0_-8px_10px_#0000000d] dark:group-hover:shadow-[inset_0_-6px_10px_#00000014] dark:group-active:shadow-[inset_0_-10px_10px_#00000014]"
    ></span>

    <!-- backdrop -->
    <span
      class="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]"
    ></span>
  </button>
</template>
