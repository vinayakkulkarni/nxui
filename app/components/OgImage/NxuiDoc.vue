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
    style="
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1c1b24 0%, #0f0e17 50%, #1a1930 100%);
      padding: 60px;
      font-family: 'Inter', sans-serif;
    "
  >
    <!-- Top: Category badge -->
    <div style="display: flex; align-items: center; gap: 12px">
      <div
        v-if="category"
        style="
          display: flex;
          align-items: center;
          padding: 6px 16px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          color: #a5b4fc;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        "
      >
        {{ category }}
      </div>
    </div>

    <!-- Middle: Title + Description -->
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div
        style="
          font-size: 64px;
          font-weight: 800;
          color: #fafafa;
          line-height: 1.1;
          letter-spacing: -0.03em;
        "
      >
        {{ title }}
      </div>
      <div
        v-if="description"
        style="
          font-size: 24px;
          color: #9d9bab;
          line-height: 1.4;
          max-width: 800px;
        "
      >
        {{ description }}
      </div>
    </div>

    <!-- Bottom: Branding -->
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
      "
    >
      <div
        style="
          font-size: 28px;
          font-weight: 700;
          color: #fafafa;
          letter-spacing: -0.02em;
        "
      >
        nxui
      </div>
      <div style="font-size: 18px; color: #6b6a7a">nxui.geoql.in</div>
    </div>
  </div>
</template>
