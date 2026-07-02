<script setup lang="ts">
  // Vue mount for Paper Shaders (https://github.com/paper-design/shaders).
  // Wraps the framework-agnostic ShaderMount class from @paper-design/shaders
  // (Apache-2.0, © Lost Coast Labs, Inc.) with Vue lifecycle + reactive props,
  // mirroring the official React binding's behavior (URL-string uniforms are
  // loaded as images before mounting).
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { ShaderMount, emptyPixel } from '@paper-design/shaders';
  import type { ShaderMountUniforms } from '@paper-design/shaders';
  import type {
    PaperShaderMountProps,
    PaperShaderUniforms,
  } from './mount-types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<PaperShaderMountProps>(), {
    speed: 0,
    frame: 0,
    minPixelRatio: undefined,
    maxPixelCount: undefined,
    mipmaps: undefined,
    class: '',
  });

  const hostRef = ref<HTMLDivElement | null>(null);
  let mount: ShaderMount | null = null;
  let disposed = false;

  /** Resize vector images to at least 1024px on the shorter side. */
  function setMinImageSize(img: HTMLImageElement): void {
    if (img.naturalWidth < 1024 && img.naturalHeight < 1024) {
      if (img.naturalWidth < 1 || img.naturalHeight < 1) return;
      const aspect = img.naturalWidth / img.naturalHeight;
      img.width = Math.round(aspect > 1 ? 1024 * aspect : 1024);
      img.height = Math.round(aspect > 1 ? 1024 : 1024 / aspect);
    }
  }

  function isValidUrl(url: string): boolean {
    try {
      if (url.startsWith('/')) return true;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function isExternalUrl(url: string): boolean {
    try {
      if (url.startsWith('/')) return false;
      const urlObject = new URL(url, window.location.origin);
      return urlObject.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /** Turn URL-string uniforms into loaded HTMLImageElements. */
  async function processUniforms(
    input: PaperShaderUniforms,
  ): Promise<ShaderMountUniforms> {
    const processed: ShaderMountUniforms = {};
    const imageLoads: Promise<void>[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        const url = value || emptyPixel;
        if (!isValidUrl(url)) {
          console.warn(
            `Uniform "${key}" has invalid URL "${url}". Skipping image loading.`,
          );
          continue;
        }
        imageLoads.push(
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            if (isExternalUrl(url)) img.crossOrigin = 'anonymous';
            img.onload = () => {
              setMinImageSize(img);
              processed[key] = img;
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load shader image at ${url}`);
              reject(new Error(`Failed to load image: ${url}`));
            };
            img.src = url;
          }),
        );
      } else if (value instanceof HTMLImageElement) {
        setMinImageSize(value);
        processed[key] = value;
      } else {
        processed[key] = value;
      }
    }

    await Promise.all(imageLoads);
    return processed;
  }

  onMounted(async () => {
    if (!hostRef.value) return;
    const uniforms = await processUniforms(props.uniforms);
    if (disposed || !hostRef.value) return;
    mount = new ShaderMount(
      hostRef.value,
      props.fragmentShader,
      uniforms,
      undefined,
      props.speed,
      props.frame,
      props.minPixelRatio,
      props.maxPixelCount,
      props.mipmaps,
    );
  });

  let uniformsGeneration = 0;
  watch(
    () => props.uniforms,
    async (next) => {
      const generation = ++uniformsGeneration;
      const uniforms = await processUniforms(next);
      // Only apply the freshest uniforms (image loads can resolve out of order).
      if (generation === uniformsGeneration && mount) {
        mount.setUniforms(uniforms);
      }
    },
    { deep: true },
  );

  watch(
    () => props.speed,
    (speed) => mount?.setSpeed(speed),
  );

  watch(
    () => props.frame,
    (frame) => mount?.setFrame(frame),
  );

  onBeforeUnmount(() => {
    disposed = true;
    mount?.dispose();
    mount = null;
  });
</script>

<template>
  <div
    ref="hostRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  ></div>
</template>
