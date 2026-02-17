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
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      backgroundColor: '#0f0e17',
      padding: '60px',
      fontFamily: 'Inter, sans-serif',
    }"
  >
    <!-- Top: Category badge -->
    <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
      <div
        v-if="category"
        :style="{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 16px',
          backgroundColor: '#1e1b4b',
          border: '1px solid #3730a3',
          borderRadius: '9999px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#a5b4fc',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }"
      >
        {{ category }}
      </div>
    </div>

    <!-- Middle: Title + Description -->
    <div :style="{ display: 'flex', flexDirection: 'column', gap: '16px' }">
      <div
        :style="{
          fontSize: '64px',
          fontWeight: 800,
          color: '#fafafa',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }"
      >
        {{ title }}
      </div>
      <div
        v-if="description"
        :style="{
          fontSize: '24px',
          color: '#9d9bab',
          lineHeight: 1.4,
          maxWidth: '800px',
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
      <div
        :style="{
          fontSize: '28px',
          fontWeight: 700,
          color: '#fafafa',
          letterSpacing: '-0.02em',
        }"
      >
        nxui
      </div>
      <div :style="{ fontSize: '18px', color: '#6b6a7a' }">nxui.geoql.in</div>
    </div>
  </div>
</template>
