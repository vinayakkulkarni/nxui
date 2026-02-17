<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, useId } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      blurStrength?: number;
      color?: string;
      metalness?: number;
      roughness?: number;
      overlayColor?: string;
      displacementStrength?: number;
      noiseScale?: number;
      specularConstant?: number;
      grayscale?: number;
      glassDistortion?: number;
      name?: string;
      role?: string;
      idNumber?: string;
      class?: string;
    }>(),
    {
      blurStrength: 12,
      color: 'white',
      metalness: 1,
      roughness: 0.4,
      overlayColor: 'rgba(255, 255, 255, 0.1)',
      displacementStrength: 20,
      noiseScale: 1,
      specularConstant: 1.2,
      grayscale: 1,
      glassDistortion: 0,
      name: 'ALEXANDER DOE',
      role: 'SENIOR DEVELOPER',
      idNumber: '8901-2345-6789',
    },
  );

  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `metallic-displacement-${uniqueId}`;

  const videoRef = ref<HTMLVideoElement | null>(null);
  const hasWebcam = ref(false);

  const baseFrequency = computed(() => 0.03 / Math.max(0.1, props.noiseScale));
  const saturation = computed(() => 1 - Math.max(0, Math.min(1, props.grayscale)));

  const cssVars = computed(() => ({
    '--blur-strength': `${props.blurStrength}px`,
    '--metalness': props.metalness,
    '--roughness': props.roughness,
    '--overlay-color': props.overlayColor,
    '--text-color': props.color,
    '--saturation': saturation.value,
  }));

  let stream: MediaStream | null = null;

  async function startWebcam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
        hasWebcam.value = true;
      }
    } catch {
      hasWebcam.value = false;
    }
  }

  onMounted(() => {
    startWebcam();
  });

  onBeforeUnmount(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  });
</script>

<template>
  <div :class="cn('rc-container', props.class)" :style="cssVars">
    <svg class="rc-svg-filters" aria-hidden="true">
      <defs>
        <filter :id="filterId" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" :baseFrequency="baseFrequency" numOctaves="2" result="noise" />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            :scale="props.displacementStrength"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rippled"
          />
          <feSpecularLighting
            in="noiseAlpha"
            :surfaceScale="props.displacementStrength"
            :specularConstant="props.specularConstant"
            specularExponent="20"
            lightingColor="#ffffff"
            result="light"
          >
            <fePointLight x="0" y="0" z="300" />
          </feSpecularLighting>
          <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
          <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="solidAlpha"
          />
          <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
          <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
          <feComponentTransfer in="blurredMap" result="glassMap">
            <feFuncA type="linear" slope="0.5" intercept="0" />
          </feComponentTransfer>
          <feDisplacementMap
            in="metallic-result"
            in2="glassMap"
            :scale="props.glassDistortion"
            xChannelSelector="A"
            yChannelSelector="A"
            result="final"
          />
        </filter>
      </defs>
    </svg>

    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      :class="['rc-video', { 'rc-video--active': hasWebcam }]"
      :style="{ filter: `saturate(${saturation}) contrast(120%) brightness(110%) blur(${props.blurStrength}px) url(#${filterId})` }"
    />

    <div v-if="!hasWebcam" class="rc-fallback-bg" />

    <div class="rc-noise" />
    <div class="rc-sheen" />
    <div class="rc-border" />

    <div class="rc-content">
      <div class="rc-header">
        <div class="rc-badge">
          <Icon name="lucide:lock" class="size-3.5" />
          <span>SECURE ACCESS</span>
        </div>
        <Icon name="lucide:activity" class="size-5 opacity-80" />
      </div>

      <div class="rc-body">
        <div class="rc-user-info">
          <h2 class="rc-name">
            {{ props.name }}
          </h2>
          <p class="rc-role">
            {{ props.role }}
          </p>
        </div>
      </div>

      <div class="rc-footer">
        <div class="rc-id-section">
          <span class="rc-label">ID NUMBER</span>
          <span class="rc-value">{{ props.idNumber }}</span>
        </div>
        <Icon name="lucide:fingerprint" class="size-8 opacity-40" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .rc-container {
    position: relative;
    width: 320px;
    height: 500px;
    border-radius: 20px;
    overflow: hidden;
    background: #1a1a1a;
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    isolation: isolate;
  }

  .rc-svg-filters {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    opacity: 0;
  }

  .rc-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.2) scaleX(-1);
    z-index: 0;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .rc-video--active {
    opacity: 0.9;
  }

  .rc-fallback-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(100, 120, 200, 0.4), transparent 60%),
      radial-gradient(ellipse at 70% 80%, rgba(60, 80, 160, 0.3), transparent 50%),
      linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
    filter: blur(8px) saturate(0.5);
  }

  .rc-noise {
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: var(--roughness, 0.4);
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    mix-blend-mode: overlay;
  }

  .rc-sheen {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.1) 40%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.1) 60%,
      rgba(255, 255, 255, 0.3) 100%
    );
    pointer-events: none;
    mix-blend-mode: overlay;
    opacity: var(--metalness, 1);
  }

  .rc-border {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.6) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: 20;
    pointer-events: none;
  }

  .rc-content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px;
    color: var(--text-color, white);
    background: var(--overlay-color, rgba(255, 255, 255, 0.05));
  }

  .rc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 16px;
  }

  .rc-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .rc-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    text-align: center;
    gap: 24px;
    margin-bottom: 2em;
  }

  .rc-name {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .rc-role {
    font-size: 12px;
    letter-spacing: 0.2em;
    opacity: 0.7;
    margin: 0;
    text-transform: uppercase;
  }

  .rc-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 24px;
  }

  .rc-id-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rc-label {
    font-size: 9px;
    letter-spacing: 0.1em;
    opacity: 0.6;
  }

  .rc-value {
    font-family: monospace;
    font-size: 14px;
    letter-spacing: 0.05em;
  }
</style>
