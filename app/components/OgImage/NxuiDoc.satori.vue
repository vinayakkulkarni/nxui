<script setup lang="ts">
  withDefaults(
    defineProps<{
      title?: string;
      description?: string;
      category?: string;
    }>(),
    {
      title: 'nxui',
      description: 'Beautiful animated components for Vue.',
      category: '',
    },
  );
</script>

<template>
  <!-- Outer container with gradient background -->
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundImage:
        'linear-gradient(145deg, #0f0e17 0%, #161229 50%, #1a0f2e 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <!-- Decorative: top-right glowing orb -->
    <div
      :style="{
        position: 'absolute',
        top: '-80px',
        right: '-60px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
      }"
    ></div>

    <!-- Decorative: bottom-left glowing orb -->
    <div
      :style="{
        position: 'absolute',
        bottom: '-100px',
        left: '-40px',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
      }"
    ></div>

    <!-- Decorative: left accent bar -->
    <div
      :style="{
        position: 'absolute',
        top: '60px',
        left: '0',
        width: '4px',
        height: '120px',
        borderRadius: '0 4px 4px 0',
        backgroundImage:
          'linear-gradient(180deg, #7c3aed, #6366f1, transparent)',
      }"
    ></div>

    <!-- Content layer -->
    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '60px 64px',
        position: 'relative',
      }"
    >
      <!-- Top: Category badge -->
      <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
        <div
          v-if="category"
          :style="{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 18px',
            backgroundColor: 'rgba(30, 27, 75, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#a5b4fc',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }"
        >
          {{ category }}
        </div>
      </div>

      <!-- Middle: Title + Description -->
      <div :style="{ display: 'flex', flexDirection: 'column', gap: '20px' }">
        <div
          :style="{
            fontSize: '68px',
            fontWeight: 800,
            color: '#fafafa',
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
          }"
        >
          {{ title }}
        </div>
        <div
          v-if="description"
          :style="{
            fontSize: '26px',
            color: '#a8a5b8',
            lineHeight: 1.4,
            maxWidth: '820px',
          }"
        >
          {{ description }}
        </div>
      </div>

      <!-- Bottom: Branding -->
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '16px' }">
          <!-- nxui wordmark -->
          <div
            :style="{
              fontSize: '30px',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
            }"
          >
            nxui
          </div>
          <!-- Separator dot -->
          <div
            :style="{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#7c3aed',
            }"
          ></div>
          <!-- Vue badge -->
          <div
            :style="{
              fontSize: '15px',
              fontWeight: 500,
              color: '#6b6a7a',
              letterSpacing: '0.02em',
            }"
          >
            Vue 3 + Tailwind CSS
          </div>
        </div>
        <div :style="{ fontSize: '18px', color: '#6b6a7a', fontWeight: 500 }">
          nxui.geoql.in
        </div>
      </div>
    </div>
  </div>
</template>
