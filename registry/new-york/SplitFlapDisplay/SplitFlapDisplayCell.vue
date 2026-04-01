<script setup lang="ts">
  const CHARACTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$.,!?:;+-=%&#@';

  const props = withDefaults(
    defineProps<{
      targetChar: string;
      flipSpeed: number;
      cellWidth: string;
      cellHeight: string;
      fontSize: string;
    }>(),
    {
      targetChar: ' ',
      flipSpeed: 35,
      cellWidth: '38px',
      cellHeight: '54px',
      fontSize: '24px',
    },
  );

  const currentChar = ref(' ');
  const nextChar = ref(' ');
  const phase = ref<'idle' | 'top-down' | 'bottom-up'>('idle');

  let flipInterval: ReturnType<typeof setInterval> | undefined;
  let charIndex = 0;

  function injectKeyframes() {
    if (document.getElementById('split-flap-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'split-flap-keyframes';
    style.textContent = `
      @keyframes flapTopDown {
        0% { transform: rotateX(0deg); }
        100% { transform: rotateX(-90deg); }
      }
      @keyframes flapBottomUp {
        0% { transform: rotateX(90deg); }
        100% { transform: rotateX(0deg); }
      }
    `;
    document.head.appendChild(style);
  }

  function startFlipping() {
    stopFlipping();
    const targetIndex = CHARACTERS.indexOf(props.targetChar.toUpperCase());
    if (targetIndex === -1) return;

    charIndex = 0;

    flipInterval = setInterval(() => {
      if (charIndex >= targetIndex) {
        stopFlipping();
        currentChar.value = CHARACTERS[targetIndex]!;
        phase.value = 'idle';
        return;
      }

      nextChar.value = CHARACTERS[charIndex + 1]!;
      phase.value = 'top-down';

      setTimeout(() => {
        phase.value = 'bottom-up';
        currentChar.value = CHARACTERS[charIndex + 1]!;
        charIndex++;

        setTimeout(() => {
          if (charIndex >= targetIndex) {
            phase.value = 'idle';
          }
        }, props.flipSpeed * 0.6);
      }, props.flipSpeed * 0.5);
    }, props.flipSpeed);
  }

  function stopFlipping() {
    if (flipInterval) {
      clearInterval(flipInterval);
      flipInterval = undefined;
    }
  }

  watch(
    () => props.targetChar,
    () => {
      charIndex = 0;
      currentChar.value = ' ';
      phase.value = 'idle';
      startFlipping();
    },
  );

  onMounted(() => {
    injectKeyframes();
    startFlipping();
  });

  onBeforeUnmount(() => {
    stopFlipping();
  });
</script>

<template>
  <div
    class="relative select-none overflow-hidden font-mono"
    :style="{
      width: props.cellWidth,
      height: props.cellHeight,
      perspective: '400px',
    }"
  >
    <!-- Static top half -->
    <div
      class="absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden"
      :style="{
        height: '50%',
        background: 'linear-gradient(to bottom, #1e1e1e, #181818)',
        borderRadius: '4px 4px 0 0',
        fontSize: props.fontSize,
        lineHeight: props.cellHeight,
        color: '#e0e0e0',
      }"
    >
      {{ currentChar }}
    </div>

    <!-- Static bottom half -->
    <div
      class="absolute inset-x-0 bottom-0 flex items-start justify-center overflow-hidden"
      :style="{
        height: '50%',
        background: 'linear-gradient(to bottom, #181818, #1e1e1e)',
        borderRadius: '0 0 4px 4px',
        fontSize: props.fontSize,
        lineHeight: props.cellHeight,
        color: '#d0d0d0',
      }"
    >
      <span
        :style="{
          transform: `translateY(-${parseFloat(props.cellHeight) / 2}px)`,
        }"
      >
        {{ currentChar }}
      </span>
    </div>

    <!-- Top flap (flips down to reveal next char) -->
    <div
      v-if="phase === 'top-down'"
      class="absolute inset-x-0 top-0 flex items-end justify-center overflow-hidden"
      :style="{
        height: '50%',
        background: 'linear-gradient(to bottom, #1e1e1e, #181818)',
        borderRadius: '4px 4px 0 0',
        fontSize: props.fontSize,
        lineHeight: props.cellHeight,
        color: '#e0e0e0',
        transformOrigin: 'bottom',
        backfaceVisibility: 'hidden',
        animation: `flapTopDown ${props.flipSpeed * 0.5}ms linear forwards`,
        zIndex: 2,
      }"
    >
      {{ currentChar }}
    </div>

    <!-- Bottom flap (flips up to show next char) -->
    <div
      v-if="phase === 'bottom-up'"
      class="absolute inset-x-0 bottom-0 flex items-start justify-center overflow-hidden"
      :style="{
        height: '50%',
        background: 'linear-gradient(to bottom, #181818, #1e1e1e)',
        borderRadius: '0 0 4px 4px',
        fontSize: props.fontSize,
        lineHeight: props.cellHeight,
        color: '#d0d0d0',
        transformOrigin: 'top',
        backfaceVisibility: 'hidden',
        animation: `flapBottomUp ${props.flipSpeed * 0.6}ms linear forwards`,
        zIndex: 2,
      }"
    >
      <span
        :style="{
          transform: `translateY(-${parseFloat(props.cellHeight) / 2}px)`,
        }"
      >
        {{ nextChar }}
      </span>
    </div>

    <!-- Center divider line -->
    <div
      class="pointer-events-none absolute inset-x-0"
      :style="{
        top: '50%',
        height: '1px',
        background: 'rgba(0, 0, 0, 0.6)',
        transform: 'translateY(-0.5px)',
        zIndex: 3,
      }"
    />
  </div>
</template>
