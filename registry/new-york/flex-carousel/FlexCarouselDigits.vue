<script setup lang="ts">
  import { computed } from 'vue';

  const props = defineProps<{ value: number }>();

  const NUMERALS = '0123456789'.split('');
  const digits = computed(() => String(props.value).padStart(2, '0').split(''));
</script>

<template>
  <span class="flex-carousel__digits">
    <span
      v-for="(digit, index) in digits"
      :key="index"
      class="flex-carousel__digit"
    >
      <span
        class="flex-carousel__reel"
        :style="{ transform: `translateY(${-Number(digit) * 10}%)` }"
      >
        <span v-for="n in NUMERALS" :key="n">{{ n }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
  .flex-carousel__digits {
    display: inline-flex;
  }

  .flex-carousel__digit {
    display: inline-block;
    height: 1em;
    overflow: hidden;
  }

  .flex-carousel__reel {
    display: flex;
    flex-direction: column;
    transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .flex-carousel__reel span {
    height: 1em;
  }

  @media (prefers-reduced-motion: reduce) {
    .flex-carousel__reel {
      transition: none;
    }
  }
</style>
