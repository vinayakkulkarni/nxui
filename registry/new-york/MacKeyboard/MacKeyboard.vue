<script setup lang="ts">
  import { useEventListener } from '@vueuse/core';
  import type { MacKeyboardProps } from '~/types/components';
  import { cn } from '~/lib/utils';
  import MacKeyboardKey from './MacKeyboardKey.vue';

  const props = withDefaults(defineProps<MacKeyboardProps>(), {
    soundSrc: '/audio/key-press.wav',
    class: '',
  });

  const activeKeys = ref<Set<string>>(new Set());
  let audioCtx: AudioContext | null = null;
  let audioBuffer: AudioBuffer | null = null;

  provide('mac-keyboard-active-keys', activeKeys);
  provide('mac-keyboard-play-sound', playSound);

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.repeat) return;
    activeKeys.value = new Set([...activeKeys.value, e.code]);
  });

  useEventListener('keyup', (e: KeyboardEvent) => {
    const next = new Set(activeKeys.value);
    next.delete(e.code);
    activeKeys.value = next;
  });

  onMounted(async () => {
    try {
      audioCtx = new AudioContext();
      const response = await fetch(props.soundSrc);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      // Audio not available — fail silently
    }
  });

  function playSound() {
    if (!audioCtx || !audioBuffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.15;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start();
  }
</script>

<template>
  <div
    :class="
      cn(
        'inline-block rounded-2xl bg-zinc-900 p-3 shadow-2xl',
        'border border-zinc-700/50',
        props.class,
      )
    "
  >
    <!-- Row 1: Esc, F1-F12, TouchID -->
    <div class="mb-1 flex gap-1">
      <MacKeyboardKey label="esc" key-code="Escape" :width="1.5" />
      <div class="flex-1" />
      <MacKeyboardKey icon="lucide:sun" key-code="F1" :width="0.8" />
      <MacKeyboardKey icon="lucide:sun" key-code="F2" :width="0.8" />
      <MacKeyboardKey
        key-code="F3"
        :width="0.8"
        icon="lucide:layout-dashboard"
      />
      <MacKeyboardKey key-code="F4" :width="0.8" icon="lucide:search" />
      <MacKeyboardKey key-code="F5" :width="0.8" icon="lucide:mic-off" />
      <MacKeyboardKey key-code="F6" :width="0.8" icon="lucide:moon" />
      <MacKeyboardKey key-code="F7" :width="0.8" icon="lucide:skip-back" />
      <MacKeyboardKey key-code="F8" :width="0.8" icon="lucide:play" />
      <MacKeyboardKey key-code="F9" :width="0.8" icon="lucide:skip-forward" />
      <MacKeyboardKey key-code="F10" :width="0.8" icon="lucide:volume" />
      <MacKeyboardKey key-code="F11" :width="0.8" icon="lucide:volume-1" />
      <MacKeyboardKey key-code="F12" :width="0.8" icon="lucide:volume-2" />
      <div class="flex-1" />
      <MacKeyboardKey icon="lucide:fingerprint" key-code="Power" :width="1" />
    </div>

    <!-- Row 2: ` 1-9 0 - = delete -->
    <div class="mb-1 flex gap-1">
      <MacKeyboardKey label="`" sub-label="~" />
      <MacKeyboardKey label="1" sub-label="!" />
      <MacKeyboardKey label="2" sub-label="@" />
      <MacKeyboardKey label="3" sub-label="#" />
      <MacKeyboardKey label="4" sub-label="$" />
      <MacKeyboardKey label="5" sub-label="%" />
      <MacKeyboardKey label="6" sub-label="^" />
      <MacKeyboardKey label="7" sub-label="&" />
      <MacKeyboardKey label="8" sub-label="*" />
      <MacKeyboardKey label="9" sub-label="(" />
      <MacKeyboardKey label="0" sub-label=")" />
      <MacKeyboardKey label="-" sub-label="_" />
      <MacKeyboardKey label="=" sub-label="+" />
      <MacKeyboardKey label="delete" key-code="Backspace" :width="1.5" />
    </div>

    <!-- Row 3: tab Q-P [ ] \ -->
    <div class="mb-1 flex gap-1">
      <MacKeyboardKey label="tab" key-code="Tab" :width="1.5" />
      <MacKeyboardKey label="Q" />
      <MacKeyboardKey label="W" />
      <MacKeyboardKey label="E" />
      <MacKeyboardKey label="R" />
      <MacKeyboardKey label="T" />
      <MacKeyboardKey label="Y" />
      <MacKeyboardKey label="U" />
      <MacKeyboardKey label="I" />
      <MacKeyboardKey label="O" />
      <MacKeyboardKey label="P" />
      <MacKeyboardKey label="[" sub-label="{" />
      <MacKeyboardKey label="]" sub-label="}" />
      <MacKeyboardKey label="\" sub-label="|" />
    </div>

    <!-- Row 4: caps A-L ; ' return -->
    <div class="mb-1 flex gap-1">
      <MacKeyboardKey label="caps lock" key-code="CapsLock" :width="1.75" />
      <MacKeyboardKey label="A" />
      <MacKeyboardKey label="S" />
      <MacKeyboardKey label="D" />
      <MacKeyboardKey label="F" />
      <MacKeyboardKey label="G" />
      <MacKeyboardKey label="H" />
      <MacKeyboardKey label="J" />
      <MacKeyboardKey label="K" />
      <MacKeyboardKey label="L" />
      <MacKeyboardKey label=";" sub-label=":" />
      <MacKeyboardKey label="'" sub-label='"' />
      <MacKeyboardKey label="return" key-code="Enter" :width="1.75" />
    </div>

    <!-- Row 5: shift Z-M , . / shift -->
    <div class="mb-1 flex gap-1">
      <MacKeyboardKey label="shift" key-code="ShiftLeft" :width="2.25" />
      <MacKeyboardKey label="Z" />
      <MacKeyboardKey label="X" />
      <MacKeyboardKey label="C" />
      <MacKeyboardKey label="V" />
      <MacKeyboardKey label="B" />
      <MacKeyboardKey label="N" />
      <MacKeyboardKey label="M" />
      <MacKeyboardKey label="," sub-label="<" />
      <MacKeyboardKey label="." sub-label=">" />
      <MacKeyboardKey label="/" sub-label="?" />
      <MacKeyboardKey label="shift" key-code="ShiftRight" :width="2.25" />
    </div>

    <!-- Row 6: fn, control, option, command, space, command, option, arrows -->
    <div class="flex gap-1">
      <MacKeyboardKey
        icon="lucide:globe"
        icon-label="fn"
        key-code="Fn"
        :width="1"
      />
      <MacKeyboardKey label="control" key-code="ControlLeft" :width="1.25" />
      <MacKeyboardKey
        icon="lucide:option"
        icon-label="option"
        key-code="AltLeft"
        :width="1.25"
      />
      <MacKeyboardKey
        icon="lucide:command"
        icon-label="command"
        key-code="MetaLeft"
        :width="1.25"
      />
      <MacKeyboardKey label="" key-code="Space" :width="5.5" />
      <MacKeyboardKey
        icon="lucide:command"
        icon-label="command"
        key-code="MetaRight"
        :width="1.25"
      />
      <MacKeyboardKey
        icon="lucide:option"
        icon-label="option"
        key-code="AltRight"
        :width="1.25"
      />

      <!-- Arrow keys: special 2x2 grid -->
      <div class="flex gap-1" style="flex: 3 0 0%">
        <MacKeyboardKey
          icon="lucide:arrow-left"
          key-code="ArrowLeft"
          :width="1"
          :no-aspect-ratio="true"
        />
        <div class="flex flex-1 flex-col gap-0.5">
          <MacKeyboardKey
            icon="lucide:arrow-up"
            key-code="ArrowUp"
            :width="1"
            :no-aspect-ratio="true"
          />
          <MacKeyboardKey
            icon="lucide:arrow-down"
            key-code="ArrowDown"
            :width="1"
            :no-aspect-ratio="true"
          />
        </div>
        <MacKeyboardKey
          icon="lucide:arrow-right"
          key-code="ArrowRight"
          :width="1"
          :no-aspect-ratio="true"
        />
      </div>
    </div>
  </div>
</template>
