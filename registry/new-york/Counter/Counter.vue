<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      value: number;
      fontSize?: number;
      padding?: number;
      gap?: number;
      borderRadius?: number;
      horizontalPadding?: number;
      textColor?: string;
      fontWeight?: string;
      gradientHeight?: number;
      gradientFrom?: string;
      gradientTo?: string;
      class?: string;
    }>(),
    {
      fontSize: 100,
      padding: 0,
      gap: 8,
      borderRadius: 4,
      horizontalPadding: 8,
      textColor: 'inherit',
      fontWeight: 'inherit',
      gradientHeight: 16,
      gradientFrom: 'black',
      gradientTo: 'transparent',
    },
  );

  const height = computed(() => props.fontSize + props.padding);

  function getPlaces(val: number): Array<number | '.'> {
    const str = String(val);
    const chars = str.split('');
    const dotIdx = chars.indexOf('.');
    return chars.map((ch, i) => {
      if (ch === '.') return '.';
      if (dotIdx === -1) return 10 ** (chars.length - i - 1);
      return i < dotIdx ? 10 ** (dotIdx - i - 1) : 10 ** -(i - dotIdx);
    });
  }

  const places = computed(() => getPlaces(props.value));

  // Spring-animated digit values
  const digitValues = ref<number[]>([]);
  const rafs = ref<number[]>([]);

  function computeTargets(): number[] {
    return places.value.map((place) => {
      if (place === '.') return 0;
      return Math.floor(props.value / (place as number));
    });
  }

  onMounted(() => {
    const targets = computeTargets();
    digitValues.value = [...targets];
  });

  watch(
    () => props.value,
    () => {
      const targets = computeTargets();
      // Animate each digit with spring physics
      rafs.value.forEach((r) => cancelAnimationFrame(r));
      rafs.value = [];

      targets.forEach((target, i) => {
        if (places.value[i] === '.') return;
        const current = digitValues.value[i] ?? target;
        let value = current;
        let velocity = 0;
        const stiffness = 100;
        const damping = 30;

        function step() {
          const force = (target - value) * stiffness;
          const dampForce = -velocity * damping;
          const acceleration = force + dampForce;
          velocity += acceleration * (1 / 60);
          value += velocity * (1 / 60);

          if (Math.abs(target - value) < 0.01 && Math.abs(velocity) < 0.01) {
            digitValues.value[i] = target;
            return;
          }
          digitValues.value[i] = value;
          rafs.value[i] = requestAnimationFrame(step);
        }
        rafs.value[i] = requestAnimationFrame(step);
      });
    },
  );

  onBeforeUnmount(() => {
    rafs.value.forEach((r) => cancelAnimationFrame(r));
  });

  function getDigitOffset(digitValue: number, num: number): number {
    const placeValue = digitValue % 10;
    const offset = (10 + num - placeValue) % 10;
    const memo = offset * height.value;
    if (offset > 5) {
      return memo - 10 * height.value;
    }
    return memo;
  }
</script>

<template>
  <span :class="cn('relative inline-block', $props.class)">
    <span
      class="flex overflow-hidden leading-none"
      :style="{
        fontSize: `${fontSize}px`,
        gap: `${gap}px`,
        borderRadius: `${borderRadius}px`,
        paddingLeft: `${horizontalPadding}px`,
        paddingRight: `${horizontalPadding}px`,
        color: textColor,
        fontWeight: fontWeight,
      }"
    >
      <span
        v-for="(place, idx) in places"
        :key="idx"
        class="relative font-[tabular-nums]"
        :style="{
          height: `${height}px`,
          width: place === '.' ? 'fit-content' : '1ch',
        }"
      >
        <template v-if="place === '.'">.</template>
        <template v-else>
          <span
            v-for="num in 10"
            :key="num - 1"
            class="absolute inset-0 flex items-center justify-center"
            :style="{
              transform: `translateY(${getDigitOffset(digitValues[idx] ?? 0, num - 1)}px)`,
            }"
          >
            {{ num - 1 }}
          </span>
        </template>
      </span>
    </span>
    <span class="pointer-events-none absolute inset-0">
      <span
        class="absolute top-0 w-full"
        :style="{
          height: `${gradientHeight}px`,
          background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
        }"
      ></span>
      <span
        class="absolute bottom-0 w-full"
        :style="{
          height: `${gradientHeight}px`,
          background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
        }"
      ></span>
    </span>
  </span>
</template>
