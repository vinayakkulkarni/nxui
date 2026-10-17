<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import ProfileCard from '@registry/new-york/profile-card/ProfileCard.vue';
  import type { ProfileCardTheme } from '@registry/new-york/profile-card/types';
  import type { Pane } from 'tweakpane';

  const AVATAR_URL =
    'https://cdn.jsdelivr.net/gh/DavidHDev/react-bits@d9085a5/public/assets/demo/person.webp';

  // Tileable nxui "n" mark: the holo foil only shows through these glyphs.
  const N_MARK =
    "<path d='M10.5 24V11m0 4.5a5.5 5.5 0 0 1 11 0V24' fill='none' stroke='#fff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/>";
  // Staggered 4×8 grid inside a 160-unit tile (seamless when repeated).
  const N_MARK_SPOTS = Array.from({ length: 32 }, (_, i) => {
    const row = Math.floor(i / 4);
    return [(i % 4) * 40 + (row % 2) * 20 + 10, row * 20 + 10];
  });
  const ICON_PATTERN_URL = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>${N_MARK_SPOTS.map(
      ([px, py]) =>
        `<g transform='translate(${px} ${py}) rotate(-28) scale(0.75) translate(-16 -17.5)'>${N_MARK}</g>`,
    ).join('')}</svg>`,
  )}`;

  const colorMode = useColorMode();
  const theme = computed<ProfileCardTheme>(() =>
    colorMode.value === 'light' ? 'light' : 'dark',
  );

  const params = reactive({
    iconPattern: true,
    backdropColor: '',
    holo: 0.8,
    glare: 0.5,
    tiltStrength: 12,
    parallax: 8,
    radius: 16,
    enableTilt: true,
    intro: true,
    showUserInfo: true,
    enableMobileTilt: false,
  });
  const picker = reactive({ backdrop: '#302c3a' });
  const introKey = ref(0);
  const contacts = ref(0);

  const iconUrl = computed(() =>
    params.iconPattern ? ICON_PATTERN_URL : undefined,
  );

  function onContactClick() {
    contacts.value += 1;
  }

  function onPaneCreated(pane: Pane) {
    pane
      .addBinding(picker, 'backdrop', { label: 'backdropColor' })
      .on('change', (event) => {
        params.backdropColor = event.value;
      });
    pane.addBinding(params, 'holo', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'glare', { min: 0, max: 1, step: 0.05 });
    pane.addBinding(params, 'tiltStrength', { min: 0, max: 25, step: 1 });
    pane.addBinding(params, 'parallax', { min: 0, max: 20, step: 1 });
    pane.addBinding(params, 'radius', { min: 0, max: 28, step: 1 });
    pane.addBinding(params, 'iconPattern');
    pane.addBinding(params, 'enableTilt');
    pane.addBinding(params, 'intro').on('change', () => {
      introKey.value += 1;
    });
    pane.addBinding(params, 'showUserInfo');
    pane.addBinding(params, 'enableMobileTilt');
  }
</script>

<template>
  <ComponentDemo
    refreshable
    :code="`<script setup lang=&quot;ts&quot;>
  import ProfileCard from '~/components/ui/profile-card/ProfileCard.vue';

  function onContactClick() {
    console.log('contact');
  }
</script>

<template>
  <ProfileCard
    avatar-url=&quot;/images/portrait.webp&quot;
    icon-url=&quot;/images/icon-pattern.png&quot;
    name=&quot;Javi A. Torres&quot;
    title=&quot;Software Engineer&quot;
    handle=&quot;javicodes&quot;
    status=&quot;Online&quot;
    contact-text=&quot;Contact&quot;
    theme=&quot;dark&quot;
    :holo=&quot;0.8&quot;
    :glare=&quot;0.5&quot;
    :tilt-strength=&quot;12&quot;
    :parallax=&quot;8&quot;
    @contact-click=&quot;onContactClick&quot;
  />
</template>`"
  >
    <div
      class="relative flex size-full min-h-160 items-center justify-center p-6"
    >
      <ProfileCard
        :key="introKey"
        :avatar-url="AVATAR_URL"
        :icon-url="iconUrl"
        name="Javi A. Torres"
        title="Software Engineer"
        handle="javicodes"
        status="Online"
        contact-text="Contact"
        :theme="theme"
        :backdrop-color="params.backdropColor || undefined"
        :holo="params.holo"
        :glare="params.glare"
        :tilt-strength="params.tiltStrength"
        :parallax="params.parallax"
        :radius="params.radius"
        :enable-tilt="params.enableTilt"
        :intro="params.intro"
        :show-user-info="params.showUserInfo"
        :enable-mobile-tilt="params.enableMobileTilt"
        @contact-click="onContactClick"
      />
      <p
        class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {{
          contacts > 0
            ? `contact clicked ×${contacts}`
            : 'move the cursor over the card'
        }}
      </p>
      <ShaderPane title="Profile Card" @on-pane-created="onPaneCreated" />
    </div>
  </ComponentDemo>
</template>
