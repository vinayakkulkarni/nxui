<script setup lang="ts">
  import SplitFlapDisplayCell from './SplitFlapDisplayCell.vue';

  const props = withDefaults(
    defineProps<{
      text?: string;
      columns?: number;
      cellWidth?: string;
      cellHeight?: string;
      fontSize?: string;
      flipSpeed?: number;
      staggerDelay?: number;
      accentColor?: string;
      showIndicator?: boolean;
    }>(),
    {
      text: '',
      columns: 14,
      cellWidth: '38px',
      cellHeight: '54px',
      fontSize: '24px',
      flipSpeed: 35,
      staggerDelay: 30,
      accentColor: '#22c55e',
      showIndicator: true,
    },
  );

  const paddedChars = computed(() => {
    const upper = props.text.toUpperCase();
    const chars: string[] = [];
    for (let i = 0; i < props.columns; i++) {
      chars.push(i < upper.length ? upper[i]! : ' ');
    }
    return chars;
  });

  const cellDelays = computed(() =>
    paddedChars.value.map((_, i) => i * props.staggerDelay),
  );

  const cellRefs = ref<HTMLElement[]>([]);
  const mounted = ref(false);

  onMounted(() => {
    // Stagger mount each cell with delay
    cellDelays.value.forEach((delay, i) => {
      setTimeout(() => {
        const el = cellRefs.value[i];
        if (el) {
          el.style.opacity = '1';
        }
      }, delay);
    });
    mounted.value = true;
  });
</script>

<template>
  <div class="flex items-center gap-0.5">
    <!-- Indicator strip -->
    <div
      v-if="props.showIndicator"
      class="shrink-0 rounded-full"
      :style="{
        width: '3px',
        height: props.cellHeight,
        backgroundColor: props.accentColor,
        marginRight: '6px',
      }"
    />

    <!-- Cells -->
    <div
      v-for="(char, i) in paddedChars"
      :key="i"
      ref="cellRefs"
      :style="{
        opacity: '0',
        transition: 'opacity 0.1s ease',
      }"
    >
      <SplitFlapDisplayCell
        :target-char="char"
        :flip-speed="props.flipSpeed"
        :cell-width="props.cellWidth"
        :cell-height="props.cellHeight"
        :font-size="props.fontSize"
      />
    </div>
  </div>
</template>
