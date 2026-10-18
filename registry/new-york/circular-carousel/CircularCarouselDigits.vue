<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{ value: number }>();

  const NUMERALS = '0123456789'.split('');
  const digits = computed(() =>
    String(props.value).padStart(2, '0').split('').map(Number),
  );
</script>

<template>
  <span class="cc-digits">
    <span v-for="(digit, index) in digits" :key="index" class="cc-digit">
      <span
        class="cc-reel"
        :style="{ transform: `translateY(${-digit * 10}%)` }"
      >
        <span v-for="n in NUMERALS" :key="n">{{ n }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
  .cc-digits {
    display: inline-flex;
  }

  .cc-digit {
    display: inline-block;
    height: 1em;
    overflow: hidden;
  }

  .cc-reel {
    display: flex;
    flex-direction: column;
    transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .cc-reel > span {
    height: 1em;
  }

  @media (prefers-reduced-motion: reduce) {
    .cc-reel {
      transition: none;
    }
  }
</style>
