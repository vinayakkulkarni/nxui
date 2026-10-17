<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import type { Pane } from 'tweakpane';
  import CurvedInput from '@registry/new-york/curved-input/CurvedInput.vue';
  import type {
    CurvedInputShadowSize,
    CurvedInputTheme,
  } from '@registry/new-york/curved-input/types';

  const colorMode = useColorMode();
  let paneRef: Pane | null = null;

  const THEME_COLORS: Record<
    CurvedInputTheme,
    {
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      buttonColor: string;
      buttonTextColor: string;
    }
  > = {
    dark: {
      backgroundColor: '#1B1722',
      textColor: '#f5f5f5',
      borderColor: '#392e4e',
      buttonColor: '#A855F7',
      buttonTextColor: '#ffffff',
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#1d2050',
      borderColor: '#262a56',
      buttonColor: '#4763eb',
      buttonTextColor: '#ffffff',
    },
  };

  const params = reactive({
    theme: 'dark' as CurvedInputTheme,
    ...THEME_COLORS.dark,
    buttonText: 'Get Started',
    shadowSize: 'md' as CurvedInputShadowSize,
    width: 450,
    bend: 28,
    height: 64,
    cornerRadius: 18,
    borderWidth: 1.5,
    fontSize: 16,
    showButton: true,
    showIcon: true,
  });

  // Until the palette is customized, the input follows the site theme.
  const customPalette = ref(false);
  const email = ref('');
  const submitted = ref('');

  const siteTheme = computed<CurvedInputTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );
  const renderedTheme = computed<CurvedInputTheme>(() =>
    customPalette.value ? params.theme : siteTheme.value,
  );
  const colors = computed(() =>
    customPalette.value
      ? {
          backgroundColor: params.backgroundColor,
          textColor: params.textColor,
          borderColor: params.borderColor,
          buttonColor: params.buttonColor,
          buttonTextColor: params.buttonTextColor,
        }
      : THEME_COLORS[siteTheme.value],
  );

  function handleSubmit(value: string): void {
    submitted.value = value;
  }

  function onThemeChange(): void {
    Object.assign(params, THEME_COLORS[params.theme]);
    customPalette.value = true;
    paneRef?.refresh();
  }

  function onColorChange(): void {
    customPalette.value = true;
  }

  function onPaneCreated(pane: Pane): void {
    paneRef = pane;
    pane
      .addBinding(params, 'theme', {
        options: { Dark: 'dark', Light: 'light' },
      })
      .on('change', onThemeChange);
    pane
      .addBinding(params, 'backgroundColor', { label: 'background' })
      .on('change', onColorChange);
    pane
      .addBinding(params, 'textColor', { label: 'text' })
      .on('change', onColorChange);
    pane
      .addBinding(params, 'borderColor', { label: 'border' })
      .on('change', onColorChange);
    pane
      .addBinding(params, 'buttonColor', { label: 'button' })
      .on('change', onColorChange);
    pane
      .addBinding(params, 'buttonTextColor', { label: 'button text' })
      .on('change', onColorChange);
    pane.addBinding(params, 'buttonText', { label: 'button label' });
    pane.addBinding(params, 'shadowSize', {
      label: 'shadow',
      options: { None: 'none', Soft: 'sm', Medium: 'md', Heavy: 'lg' },
    });
    pane.addBinding(params, 'width', { min: 340, max: 720, step: 10 });
    pane.addBinding(params, 'bend', { min: -60, max: 60, step: 1 });
    pane.addBinding(params, 'height', { min: 48, max: 96, step: 1 });
    pane.addBinding(params, 'cornerRadius', { min: 0, max: 36, step: 1 });
    pane.addBinding(params, 'borderWidth', { min: 0, max: 4, step: 0.5 });
    pane.addBinding(params, 'fontSize', { min: 13, max: 22, step: 1 });
    pane.addBinding(params, 'showButton');
    pane.addBinding(params, 'showIcon');
  }
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import CurvedInput from '~/components/ui/curved-input/CurvedInput.vue';

  const email = ref('');

  function handleSubmit(value: string): void {
    console.log('Submitted:', value);
  }
</script>

<template>
  <CurvedInput
    v-model=&quot;email&quot;
    placeholder=&quot;david@nxui.dev&quot;
    button-text=&quot;Get Started&quot;
    theme=&quot;dark&quot;
    :width=&quot;450&quot;
    :bend=&quot;28&quot;
    :height=&quot;64&quot;
    :corner-radius=&quot;18&quot;
    shadow-size=&quot;md&quot;
    @submit=&quot;handleSubmit&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-100 flex-col items-center justify-center gap-8 overflow-hidden p-6 md:px-12"
    >
      <div class="flex w-full max-w-180 justify-center">
        <CurvedInput
          v-model="email"
          placeholder="david@nxui.dev"
          :theme="renderedTheme"
          :background-color="colors.backgroundColor"
          :text-color="colors.textColor"
          :border-color="colors.borderColor"
          :button-color="colors.buttonColor"
          :button-text-color="colors.buttonTextColor"
          :button-text="params.buttonText"
          :shadow-size="params.shadowSize"
          :width="params.width"
          :bend="params.bend"
          :height="params.height"
          :corner-radius="params.cornerRadius"
          :border-width="params.borderWidth"
          :font-size="params.fontSize"
          :show-button="params.showButton"
          :show-icon="params.showIcon"
          @submit="handleSubmit"
        />
      </div>
      <p
        class="pointer-events-none absolute inset-x-0 bottom-6 text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {{ submitted ? `submitted: ${submitted}` : 'click the curve and type' }}
      </p>
      <ShaderPane title="Curved Input" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
