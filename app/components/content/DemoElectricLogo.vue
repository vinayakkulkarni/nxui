<script setup lang="ts">
  import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue';
  import ElectricLogo from '@registry/new-york/electric-logo/ElectricLogo.vue';
  import type { ElectricLogoTheme } from '@registry/new-york/electric-logo/types';
  import type { Pane } from 'tweakpane';

  const svg = (body: string, box: number) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${box * 8}" height="${box * 8}" viewBox="0 0 ${box} ${box}">${body}</svg>`,
    )}`;

  const NXUI_LOGO = svg(
    '<path d="M10.5 24V11m0 4.5a5.5 5.5 0 0 1 11 0V24" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    32,
  );

  const LOGOS = new Map<string, string>([
    ['nxui', NXUI_LOGO],
    [
      'apple',
      svg(
        '<path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="#fff"/>',
        24,
      ),
    ],
    [
      'tesla',
      svg(
        '<path d="M12 5.362l2.475-3.026s4.245.09 8.471 2.054c-1.082 1.636-3.231 2.438-3.231 2.438-.146-1.439-1.154-1.79-4.354-1.79L12 24 8.619 5.034c-3.18 0-4.188.354-4.335 1.792 0 0-2.146-.795-3.229-2.43C5.28 2.431 9.525 2.34 9.525 2.34L12 5.362l-.004.002H12v-.002zm0-3.899c3.415-.03 7.326.528 11.328 2.28.535-.968.672-1.395.672-1.395C19.625.612 15.528.015 12 0 8.472.015 4.375.61 0 2.349c0 0 .195.525.672 1.396C4.674 1.989 8.585 1.435 12 1.46v.003z" fill="#fff"/>',
        24,
      ),
    ],
    [
      'openai',
      svg(
        '<path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="#fff"/>',
        24,
      ),
    ],
  ]);

  const PALETTES = new Map([
    [
      'nxui',
      {
        dark: { color: '#ecc7ff', glowColor: '#ad6dff' },
        light: { color: '#a953ff', glowColor: '#c79bff' },
      },
    ],
    [
      'apple',
      {
        dark: { color: '#cadcff', glowColor: '#528aff' },
        light: { color: '#3377ff', glowColor: '#99b8ff' },
      },
    ],
    [
      'tesla',
      {
        dark: { color: '#ffcdd2', glowColor: '#ff5260' },
        light: { color: '#ef3848', glowColor: '#ffa3ab' },
      },
    ],
    [
      'openai',
      {
        dark: { color: '#c2fff1', glowColor: '#1fd8b6' },
        light: { color: '#0ea88f', glowColor: '#7fe6d5' },
      },
    ],
  ]);

  const DEFAULT_BEND = 0.6;
  const LIGHT_BEND = 0.5;

  const colorMode = useColorMode();
  const theme = computed<ElectricLogoTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const params = reactive({
    image: 'nxui',
    color: '#ecc7ff',
    glowColor: '#ad6dff',
    scale: 0.7,
    intensity: 1,
    glow: 1,
    thickness: 1.5,
    strands: 4,
    bend: DEFAULT_BEND,
    crackle: 1.5,
    arcs: 1,
    flicker: 0.6,
    fill: 0,
    speed: 2.5,
    interactive: true,
    cursorIntensity: 0.75,
    cursorRadius: 100,
  });

  const upload = ref<string | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);
  const pane = shallowRef<Pane | null>(null);

  const src = computed(() => {
    if (params.image === 'upload' && upload.value) return upload.value;
    return LOGOS.get(params.image) ?? NXUI_LOGO;
  });

  function lightFor(name: 'color' | 'glowColor', value: string): string {
    const palette = [...PALETTES.values()].find(
      (entry) => entry.dark[name] === value,
    );
    return palette ? palette.light[name] : value;
  }

  const renderedColor = computed(() =>
    theme.value === 'light' ? lightFor('color', params.color) : params.color,
  );
  const renderedGlow = computed(() =>
    theme.value === 'light'
      ? lightFor('glowColor', params.glowColor)
      : params.glowColor,
  );
  const renderedBend = computed(() =>
    theme.value === 'light' && params.bend === DEFAULT_BEND
      ? LIGHT_BEND
      : params.bend,
  );

  function selectImage() {
    const palette = PALETTES.get(params.image);
    if (!palette) return;
    params.color = palette.dark.color;
    params.glowColor = palette.dark.glowColor;
    pane.value?.refresh();
  }

  function onFile(event: Event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (upload.value) URL.revokeObjectURL(upload.value);
    upload.value = URL.createObjectURL(file);
    params.image = 'upload';
    pane.value?.refresh();
  }

  function openPicker() {
    fileInput.value?.click();
  }

  onBeforeUnmount(() => {
    if (upload.value) URL.revokeObjectURL(upload.value);
  });

  function onPaneCreated(created: Pane) {
    pane.value = created;
    created
      .addBinding(params, 'image', {
        options: {
          nxui: 'nxui',
          Apple: 'apple',
          Tesla: 'tesla',
          OpenAI: 'openai',
          'Your upload': 'upload',
        },
      })
      .on('change', selectImage);
    created.addButton({ title: 'Upload SVG or PNG' }).on('click', openPicker);
    created.addBinding(params, 'color');
    created.addBinding(params, 'glowColor');
    created.addBinding(params, 'scale', { min: 0.2, max: 1, step: 0.05 });
    created.addBinding(params, 'intensity', { min: 0.2, max: 2, step: 0.05 });
    created.addBinding(params, 'glow', { min: 0, max: 2, step: 0.05 });
    created.addBinding(params, 'fill', { min: 0, max: 1, step: 0.05 });
    created.addBinding(params, 'thickness', { min: 0.5, max: 3, step: 0.1 });
    created.addBinding(params, 'strands', { min: 1, max: 6, step: 1 });
    created.addBinding(params, 'bend', { min: 0, max: 2, step: 0.05 });
    created.addBinding(params, 'crackle', { min: 0, max: 2, step: 0.05 });
    created.addBinding(params, 'arcs', { min: 0, max: 2, step: 0.05 });
    created.addBinding(params, 'flicker', { min: 0, max: 1, step: 0.05 });
    created.addBinding(params, 'speed', { min: 0, max: 3, step: 0.05 });
    created.addBinding(params, 'interactive');
    created.addBinding(params, 'cursorIntensity', {
      min: 0,
      max: 2,
      step: 0.05,
    });
    created.addBinding(params, 'cursorRadius', { min: 40, max: 300, step: 5 });
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ElectricLogo from '~/components/ui/electric-logo/ElectricLogo.vue';
</script>

<template>
  <div class=&quot;relative h-125 w-full overflow-hidden&quot;>
    <ElectricLogo
      src=&quot;/logo.svg&quot;
      color=&quot;#ecc7ff&quot;
      glow-color=&quot;#ad6dff&quot;
      :scale=&quot;0.7&quot;
      :intensity=&quot;1&quot;
      :glow=&quot;1&quot;
      :thickness=&quot;1.5&quot;
      :strands=&quot;4&quot;
      :bend=&quot;0.6&quot;
      :crackle=&quot;1.5&quot;
      :arcs=&quot;1&quot;
      :flicker=&quot;0.6&quot;
      :speed=&quot;2.5&quot;
      :cursor-intensity=&quot;0.75&quot;
      :cursor-radius=&quot;100&quot;
      theme=&quot;dark&quot;
    />
  </div>
</template>`"
  >
    <div class="relative size-full min-h-80">
      <ElectricLogo
        class="absolute inset-0 size-full"
        :src="src"
        :color="renderedColor"
        :glow-color="renderedGlow"
        :scale="params.scale"
        :intensity="params.intensity"
        :glow="params.glow"
        :thickness="params.thickness"
        :strands="params.strands"
        :bend="renderedBend"
        :crackle="params.crackle"
        :arcs="params.arcs"
        :flicker="params.flicker"
        :fill="params.fill"
        :speed="params.speed"
        :interactive="params.interactive"
        :cursor-intensity="params.cursorIntensity"
        :cursor-radius="params.cursorRadius"
        :theme="theme"
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/svg+xml,image/png,image/webp,image/jpeg"
        class="hidden"
        aria-label="Upload a logo to electrify"
        @change="onFile"
      />
      <ShaderPane title="Electric Logo" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
