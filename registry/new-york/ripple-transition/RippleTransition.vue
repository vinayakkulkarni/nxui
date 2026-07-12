<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { animate } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    VERT,
    FRAG,
    compileShader,
    loadImage,
    uploadTexture,
  } from './shader';
  import type { LoadedImage } from './shader';
  import type { RippleTransitionProps } from './types';

  const props = withDefaults(defineProps<RippleTransitionProps>(), {
    images: () => [
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=85&w=1800',
      'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&q=85&w=1800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=85&w=1800',
    ],
    duration: 1.4,
    autoPlay: false,
    autoPlayInterval: 3200,
    autoPlayOrigin: 'center',
    waveSpeed: 1.6,
    sigma: 0.15,
    waveFreq: 5,
    pushAmt: 0.145,
    caStrength: 0.02,
    glow: 0.73,
    noiseWarp: 1,
    pinch: false,
    borderRadius: 24,
    background: '#111416',
    label: 'Ripple image transition',
    class: '',
  });

  const wrapper = ref<HTMLDivElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  const webglFailed = ref(false);

  let renderFn: (() => void) | null = null;
  let triggerFn: ((x?: number, y?: number) => void) | null = null;
  let cleanupFn: (() => void) | null = null;
  let autoTimer: number | null = null;

  async function setup(): Promise<void> {
    const canvasEl = canvas.value;
    const wrapperEl = wrapper.value;
    if (!canvasEl || !wrapperEl) return;

    const loaded = (await Promise.all(props.images.map(loadImage))).filter(
      (item): item is LoadedImage => item !== null,
    );
    if (loaded.length === 0) return;

    const firstImage = loaded[0]!;
    const secondImage = loaded[1] ?? firstImage;
    const gl = canvasEl.getContext('webgl', {
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) {
      webglFailed.value = true;
      return;
    }

    const vertexShader = compileShader(gl, VERT, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAG, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create WebGL program.');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ?? 'WebGL program link error.',
      );
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texA = uploadTexture(gl, 0, firstImage.image);
    const texB = uploadTexture(gl, 1, secondImage.image);

    gl.uniform1i(gl.getUniformLocation(program, 'u_texA'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_texB'), 1);

    const uniforms = {
      res: gl.getUniformLocation(program, 'u_resolution'),
      texASize: gl.getUniformLocation(program, 'u_texASize'),
      texBSize: gl.getUniformLocation(program, 'u_texBSize'),
      center: gl.getUniformLocation(program, 'u_center'),
      progress: gl.getUniformLocation(program, 'u_progress'),
      waveSpeed: gl.getUniformLocation(program, 'u_waveSpeed'),
      sigma: gl.getUniformLocation(program, 'u_sigma'),
      waveFreq: gl.getUniformLocation(program, 'u_waveFreq'),
      pushAmt: gl.getUniformLocation(program, 'u_pushAmt'),
      caStrength: gl.getUniformLocation(program, 'u_caStrength'),
      glow: gl.getUniformLocation(program, 'u_glow'),
      noiseWarp: gl.getUniformLocation(program, 'u_noiseWarp'),
      swap: gl.getUniformLocation(program, 'u_swap'),
      pinch: gl.getUniformLocation(program, 'u_pinch'),
    };

    const state = {
      progress: 0,
      cx: 0.5,
      cy: 0.5,
      swap: 0,
      currentIndex: 0,
      texASize: { width: firstImage.width, height: firstImage.height },
      texBSize: { width: secondImage.width, height: secondImage.height },
      pinch: 0,
    };

    const render = (): void => {
      gl.uniform2f(uniforms.res, canvasEl.width, canvasEl.height);
      gl.uniform2f(
        uniforms.texASize,
        state.texASize.width,
        state.texASize.height,
      );
      gl.uniform2f(
        uniforms.texBSize,
        state.texBSize.width,
        state.texBSize.height,
      );
      gl.uniform2f(uniforms.center, state.cx, state.cy);
      gl.uniform1f(uniforms.progress, state.progress);
      gl.uniform1f(uniforms.waveSpeed, props.waveSpeed);
      gl.uniform1f(uniforms.sigma, props.sigma);
      gl.uniform1f(uniforms.waveFreq, props.waveFreq);
      gl.uniform1f(uniforms.pushAmt, props.pushAmt);
      gl.uniform1f(uniforms.caStrength, props.caStrength);
      gl.uniform1f(uniforms.glow, props.glow);
      gl.uniform1f(uniforms.noiseWarp, props.noiseWarp);
      gl.uniform1f(uniforms.swap, state.swap);
      gl.uniform1f(uniforms.pinch, state.pinch);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    renderFn = render;

    const resize = (): void => {
      const rect = wrapperEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvasEl.width !== width || canvasEl.height !== height) {
        canvasEl.width = width;
        canvasEl.height = height;
        gl.viewport(0, 0, width, height);
      }
      renderFn?.();
    };

    const rebindTargetSlot = (): void => {
      if (loaded.length <= 2) return;
      const nextIndex = (state.currentIndex + 1) % loaded.length;
      const nextImage = loaded[nextIndex]!;
      const targetUnit = state.swap > 0.5 ? 0 : 1;
      const targetTexture = state.swap > 0.5 ? texA : texB;
      gl.activeTexture(gl.TEXTURE0 + targetUnit);
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        nextImage.image,
      );
      if (targetUnit === 0) {
        state.texASize = { width: nextImage.width, height: nextImage.height };
      } else {
        state.texBSize = { width: nextImage.width, height: nextImage.height };
      }
    };

    let animating = false;
    let progressAnim: { stop: () => void } | null = null;
    let pinchAnim: { stop: () => void } | null = null;

    const trigger = (cx = 0.5, cy = 0.5): void => {
      if (animating || loaded.length < 2) return;
      state.cx = cx;
      state.cy = cy;
      state.progress = 0;
      state.pinch = 0;
      animating = true;
      progressAnim?.stop();
      pinchAnim?.stop();

      if (props.pinch) {
        pinchAnim = animate(0, [1, 0], {
          duration: 0.5,
          times: [0, 0.2, 1],
          ease: ['easeOut', 'easeIn'],
          onUpdate: (value: number) => {
            state.pinch = value;
            render();
          },
        });
      }

      progressAnim = animate(0, 1, {
        duration: props.duration,
        ease: 'easeInOut',
        onUpdate: (value: number) => {
          state.progress = value;
          render();
        },
        onComplete: () => {
          state.currentIndex = (state.currentIndex + 1) % loaded.length;
          state.swap = state.swap > 0.5 ? 0 : 1;
          state.progress = 0;
          rebindTargetSlot();
          animating = false;
          render();
        },
      });
    };
    triggerFn = trigger;

    const handlePointerUp = (event: PointerEvent): void => {
      const rect = canvasEl.getBoundingClientRect();
      trigger(
        (event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height,
      );
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapperEl);
    window.addEventListener('resize', resize);
    canvasEl.addEventListener('pointerup', handlePointerUp);
    resize();

    cleanupFn = () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      canvasEl.removeEventListener('pointerup', handlePointerUp);
      progressAnim?.stop();
      pinchAnim?.stop();
      triggerFn = null;
      renderFn = null;
      gl.deleteTexture(texA);
      gl.deleteTexture(texB);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }

  function startAutoPlay(): void {
    stopAutoPlay();
    if (!props.autoPlay) return;
    autoTimer = window.setInterval(() => {
      const origin =
        props.autoPlayOrigin === 'random'
          ? { x: 0.18 + Math.random() * 0.64, y: 0.18 + Math.random() * 0.64 }
          : { x: 0.5, y: 0.5 };
      triggerFn?.(origin.x, origin.y);
    }, props.autoPlayInterval);
  }

  function stopAutoPlay(): void {
    if (autoTimer !== null) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerFn?.(0.5, 0.5);
    }
  }

  onMounted(() => {
    setup()
      .then(() => startAutoPlay())
      .catch(() => {
        webglFailed.value = true;
      });
  });

  watch(
    [
      () => props.autoPlay,
      () => props.autoPlayInterval,
      () => props.autoPlayOrigin,
    ],
    () => startAutoPlay(),
  );

  watch(
    [
      () => props.waveSpeed,
      () => props.sigma,
      () => props.waveFreq,
      () => props.pushAmt,
      () => props.caStrength,
      () => props.glow,
      () => props.noiseWarp,
    ],
    () => renderFn?.(),
  );

  watch(
    () => props.images,
    () => {
      cleanupFn?.();
      cleanupFn = null;
      setup().then(() => startAutoPlay());
    },
  );

  onBeforeUnmount(() => {
    stopAutoPlay();
    cleanupFn?.();
  });
</script>

<template>
  <div
    ref="wrapper"
    :class="
      cn(
        'relative size-full min-h-80 cursor-pointer overflow-hidden leading-none',
        props.class,
      )
    "
    :style="{
      borderRadius: `${borderRadius}px`,
      background,
      touchAction: 'manipulation',
    }"
    role="button"
    tabindex="0"
    :aria-label="label"
    @keydown="handleKeydown"
  >
    <div
      v-if="webglFailed"
      class="flex size-full items-center justify-center p-6 text-center font-mono text-sm text-white/60"
    >
      Ripple transitions need WebGL, which is unavailable in this browser.
    </div>
    <canvas v-else ref="canvas" class="absolute inset-0 size-full" />
  </div>
</template>
