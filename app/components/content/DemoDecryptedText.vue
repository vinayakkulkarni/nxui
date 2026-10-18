<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue';
  import DecryptedText from '@registry/new-york/decrypted-text/DecryptedText.vue';
  import type { DecryptedTextProps } from '@registry/new-york/decrypted-text/types';
  import type { Pane } from 'tweakpane';

  const colorMode = useColorMode();

  const CHARACTER_SETS = {
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
    hex: '0123456789ABCDEF',
    binary: '01',
    blocks: '█▓▒░',
    symbols: '!<>-_/[]{}=+*^?#',
  };

  const LOOK: Required<
    Pick<
      DecryptedTextProps,
      | 'scrambleColor'
      | 'effect'
      | 'animateOn'
      | 'speed'
      | 'maxIterations'
      | 'sequential'
      | 'revealDirection'
      | 'hoverRadius'
      | 'loop'
      | 'loopDelay'
      | 'characters'
      | 'useOriginalCharsOnly'
      | 'clickMode'
    >
  > = {
    scrambleColor: '',
    effect: 'scramble',
    animateOn: 'inViewHover',
    speed: 60,
    maxIterations: 10,
    sequential: true,
    revealDirection: 'start',
    hoverRadius: 100,
    loop: false,
    loopDelay: 2000,
    characters: CHARACTER_SETS.letters,
    useOriginalCharsOnly: false,
    clickMode: 'once',
  };

  const PRESETS: Record<string, Partial<typeof LOOK>> = {
    classic: {},
    terminal: {
      scrambleColor: '#2bb673',
      revealDirection: 'random',
      speed: 40,
      hoverRadius: 70,
      characters: CHARACTER_SETS.hex,
    },
    flip: {
      effect: 'flip',
      revealDirection: 'center',
      speed: 70,
      hoverRadius: 0,
    },
    loop: {
      effect: 'fade',
      animateOn: 'view',
      speed: 45,
      hoverRadius: 0,
      loop: true,
      loopDelay: 1800,
      characters: CHARACTER_SETS.symbols,
    },
  };

  const ink = computed(() =>
    colorMode.value === 'light' ? '#18181b' : '#ffffff',
  );

  const params = reactive({
    preset: 'classic',
    ...LOOK,
    scrambleColor: '#ffffff',
  });

  const scrambleColor = computed(() =>
    params.scrambleColor && params.scrambleColor !== ink.value
      ? params.scrambleColor
      : '',
  );

  const renderKey = ref(0);
  let paneRef: Pane | null = null;

  watch(
    ink,
    (value, previous) => {
      if (!previous || params.scrambleColor === previous) {
        params.scrambleColor = value;
      }
      paneRef?.refresh();
    },
    { immediate: true },
  );

  watch(
    [
      () => params.effect,
      () => params.animateOn,
      () => params.clickMode,
      () => params.speed,
      () => params.maxIterations,
      () => params.sequential,
      () => params.revealDirection,
      () => params.hoverRadius,
      () => params.loop,
      () => params.loopDelay,
      () => params.characters,
      () => params.useOriginalCharsOnly,
    ],
    () => renderKey.value++,
  );

  function applyPreset(name: string) {
    Object.assign(params, LOOK, { scrambleColor: ink.value }, PRESETS[name]);
    paneRef?.refresh();
  }

  function onPaneCreated(pane: Pane) {
    paneRef = pane;
    pane
      .addBinding(params, 'preset', {
        options: {
          Classic: 'classic',
          Terminal: 'terminal',
          Flip: 'flip',
          Loop: 'loop',
        },
      })
      .on('change', (event) => applyPreset(event.value));
    pane.addBinding(params, 'scrambleColor', { label: 'scramble color' });
    pane.addBinding(params, 'effect', {
      options: { Scramble: 'scramble', Flip: 'flip', Fade: 'fade' },
    });
    pane.addBinding(params, 'animateOn', {
      label: 'animate on',
      options: {
        View: 'view',
        Hover: 'hover',
        'View & Hover': 'inViewHover',
        Click: 'click',
      },
    });
    pane.addBinding(params, 'clickMode', {
      label: 'click mode',
      options: { Once: 'once', Toggle: 'toggle' },
    });
    pane.addBinding(params, 'revealDirection', {
      label: 'direction',
      options: {
        Start: 'start',
        End: 'end',
        Center: 'center',
        Random: 'random',
      },
    });
    pane.addBinding(params, 'speed', { min: 20, max: 200, step: 5 });
    pane.addBinding(params, 'maxIterations', {
      label: 'iterations',
      min: 1,
      max: 40,
      step: 1,
    });
    pane.addBinding(params, 'hoverRadius', { min: 0, max: 240, step: 10 });
    pane.addBinding(params, 'loop');
    pane.addBinding(params, 'loopDelay', { min: 400, max: 5000, step: 100 });
    pane.addBinding(params, 'sequential');
    pane.addBinding(params, 'characters', {
      options: {
        Letters: CHARACTER_SETS.letters,
        Hex: CHARACTER_SETS.hex,
        Binary: CHARACTER_SETS.binary,
        Blocks: CHARACTER_SETS.blocks,
        Symbols: CHARACTER_SETS.symbols,
      },
    });
    pane.addBinding(params, 'useOriginalCharsOnly', {
      label: 'original chars',
    });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import DecryptedText from '~/components/ui/decrypted-text/DecryptedText.vue';
</script>

<template>
  <DecryptedText
    text=&quot;Hacking into the mainframe...&quot;
    animate-on=&quot;inViewHover&quot;
    effect=&quot;scramble&quot;
    :speed=&quot;60&quot;
    :sequential=&quot;true&quot;
    reveal-direction=&quot;start&quot;
    :hover-radius=&quot;100&quot;
    scramble-color=&quot;#2bb673&quot;
    class=&quot;max-w-[30ch] cursor-pointer text-[2rem]&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="flex w-4/5 px-2">
        <DecryptedText
          :key="renderKey"
          text="Hacking into the mainframe..."
          :effect="params.effect"
          :animate-on="params.animateOn"
          :click-mode="params.clickMode"
          :speed="params.speed"
          :max-iterations="params.maxIterations"
          :sequential="params.sequential"
          :reveal-direction="params.revealDirection"
          :hover-radius="params.hoverRadius"
          :loop="params.loop"
          :loop-delay="params.loopDelay"
          :characters="params.characters"
          :use-original-chars-only="params.useOriginalCharsOnly"
          :scramble-color="scrambleColor"
          class="max-w-[30ch] cursor-pointer text-base text-foreground sm:text-[2rem]"
        />
      </div>
      <ShaderPane title="Decrypted Text" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
