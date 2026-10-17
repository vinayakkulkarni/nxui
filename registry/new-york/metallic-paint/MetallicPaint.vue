<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { FRAGMENT, VERTEX } from './metallic-paint-shaders';
  import {
    MAX_PIXELS,
    clamp,
    drawImageSource,
    drawTextSource,
    parseColor,
    processShape,
  } from './metallic-paint-shape';
  import type { MetallicPaintProps } from './types';

  const props = withDefaults(defineProps<MetallicPaintProps>(), {
    imageSrc: undefined,
    text: undefined,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 800,
    color: '#ffffff',
    backgroundColor: 'transparent',
    density: 2,
    softness: 0.1,
    dispersion: 0.3,
    distortion: 0.07,
    edgeBend: 0.6,
    angle: 70,
    speed: 1,
    scale: 0.6,
    rotation: 0,
    mouseTilt: 0.5,
    lightMode: false,
    intro: true,
    paused: false,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const tint = computed(() => parseColor(props.color, [1, 1, 1, 1]));
  const back = computed(() => parseColor(props.backgroundColor, [0, 0, 0, 0]));

  let gl: WebGL2RenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  const uniforms: Record<string, WebGLUniformLocation | null> = {};

  const state = {
    last: 0,
    time: 0,
    visible: true,
    pending: false,
    hasImage: false,
    imageAspect: 1,
    width: 0,
    height: 0,
    revealStart: -1,
    reveal: 1,
    tiltX: 0,
    tiltY: 0,
    velocityX: 0,
    velocityY: 0,
    targetX: 0,
    targetY: 0,
    alive: false,
    reduce: false,
  };

  function compile(
    context: WebGL2RenderingContext,
    type: number,
    source: string,
  ) {
    const shader = context.createShader(type);
    if (!shader) return null;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (context.getShaderParameter(shader, context.COMPILE_STATUS))
      return shader;
    context.deleteShader(shader);
    return null;
  }

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!gl || !container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const base = props.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
    let ratio = Math.max(base, 2);
    const pixels = rect.width * rect.height * ratio * ratio;
    if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (width === state.width && height === state.height) return;
    state.width = width;
    state.height = height;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function draw() {
    if (!gl || !program) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (state.pending || !state.hasImage) return;
    const t = tint.value;
    const b = back.value;
    gl.useProgram(program);
    gl.uniform2f(uniforms.u_resolution ?? null, state.width, state.height);
    gl.uniform1f(uniforms.u_time ?? null, state.time);
    gl.uniform1f(uniforms.u_imageAspect ?? null, state.imageAspect);
    gl.uniform1f(uniforms.u_scale ?? null, Math.max(0.05, props.scale));
    gl.uniform1f(uniforms.u_rotation ?? null, props.rotation);
    gl.uniform4f(uniforms.u_colorBack ?? null, b[0], b[1], b[2], b[3]);
    gl.uniform4f(uniforms.u_colorTint ?? null, t[0], t[1], t[2], t[3]);
    gl.uniform1f(uniforms.u_softness ?? null, clamp(props.softness, 0, 1));
    gl.uniform1f(uniforms.u_repetition ?? null, clamp(props.density, 0.5, 12));
    gl.uniform1f(uniforms.u_shiftRed ?? null, clamp(props.dispersion, -1, 1));
    gl.uniform1f(uniforms.u_shiftBlue ?? null, clamp(props.dispersion, -1, 1));
    gl.uniform1f(uniforms.u_distortion ?? null, clamp(props.distortion, 0, 1));
    gl.uniform1f(uniforms.u_contour ?? null, clamp(props.edgeBend, 0, 1));
    gl.uniform1f(uniforms.u_angle ?? null, props.angle);
    gl.uniform2f(uniforms.u_tilt ?? null, state.tiltX, state.tiltY);
    gl.uniform1f(uniforms.u_reveal ?? null, state.reveal);
    gl.uniform1f(uniforms.u_light ?? null, props.lightMode ? 1 : 0);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now: number) {
    if (!state.alive) {
      pause();
      return;
    }
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    const moving = !props.paused && !state.reduce && props.speed !== 0;
    if (moving) state.time += dt * props.speed;

    let busy = moving;
    if (state.reveal < 1 && !state.pending) {
      if (state.revealStart < 0) state.revealStart = now;
      const progress = clamp((now - state.revealStart) / 1600, 0, 1);
      state.reveal = 1 - (1 - progress) ** 3;
      if (moving) state.time += dt * 2.4 * (1 - progress) ** 2;
      busy = true;
    }

    const tilt = clamp(props.mouseTilt, 0, 1.5);
    const stiffness = 60;
    const damping = 14;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      state.velocityX +=
        (stiffness * (state.targetX * tilt - state.tiltX) -
          damping * state.velocityX) *
        h;
      state.velocityY +=
        (stiffness * (state.targetY * tilt - state.tiltY) -
          damping * state.velocityY) *
        h;
      state.tiltX += state.velocityX * h;
      state.tiltY += state.velocityY * h;
    }
    if (
      Math.abs(state.targetX * tilt - state.tiltX) > 0.0005 ||
      Math.abs(state.targetY * tilt - state.tiltY) > 0.0005 ||
      Math.abs(state.velocityX) + Math.abs(state.velocityY) > 0.0005
    ) {
      busy = true;
    }

    draw();
    if (!busy || !state.visible) {
      state.last = 0;
      pause();
    }
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => frame(timestamp),
    {
      immediate: false,
    },
  );

  function wake() {
    if (!isActive.value && state.alive && state.visible) resume();
  }

  function redraw() {
    resize();
    draw();
    wake();
  }

  function setImage(data: ImageData | null) {
    if (!gl || !texture) return;
    state.pending = false;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (data) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      state.imageAspect = data.width / data.height;
      state.hasImage = true;
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 255, 255]),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      state.imageAspect = 1;
      state.hasImage = false;
    }
    draw();
    wake();
  }

  let sourceToken = 0;

  function loadSource() {
    const token = ++sourceToken;
    const source = props.text
      ? drawTextSource(props.text, props.fontFamily, props.fontWeight)
      : props.imageSrc
        ? drawImageSource(props.imageSrc)
        : null;
    if (!source) {
      setImage(null);
      return;
    }
    state.pending = true;
    draw();
    source
      .then((canvas) => {
        if (token !== sourceToken || !canvas) return;
        const data = processShape(canvas);
        if (token === sourceToken) setImage(data);
      })
      .catch(() => {
        if (token === sourceToken) setImage(null);
      });
  }

  function onPointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    state.targetX = clamp(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -1.2,
      1.2,
    );
    state.targetY = clamp(
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
      -1.2,
      1.2,
    );
    wake();
  }

  function onPointerLeave() {
    state.targetX = 0;
    state.targetY = 0;
    wake();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    state.alive = false;
    pause();
  }

  useEventListener(containerRef, 'pointermove', onPointerMove);
  useEventListener(containerRef, 'pointerleave', onPointerLeave);
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);

  useResizeObserver(containerRef, () => {
    resize();
    draw();
  });

  useIntersectionObserver(containerRef, (entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
    if (state.visible) wake();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const context = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!context) return;
    const vertex = compile(context, context.VERTEX_SHADER, VERTEX);
    const fragment = compile(context, context.FRAGMENT_SHADER, FRAGMENT);
    const linked = context.createProgram();
    if (!vertex || !fragment || !linked) return;
    context.attachShader(linked, vertex);
    context.attachShader(linked, fragment);
    context.linkProgram(linked);
    context.deleteShader(vertex);
    context.deleteShader(fragment);
    if (!context.getProgramParameter(linked, context.LINK_STATUS)) return;
    context.useProgram(linked);
    gl = context;
    program = linked;

    const count: number = context.getProgramParameter(
      linked,
      context.ACTIVE_UNIFORMS,
    );
    for (let i = 0; i < count; i++) {
      const info = context.getActiveUniform(linked, i);
      if (info)
        uniforms[info.name] = context.getUniformLocation(linked, info.name);
    }

    vao = context.createVertexArray();
    buffer = context.createBuffer();
    context.bindVertexArray(vao);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      context.STATIC_DRAW,
    );
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);

    texture = context.createTexture();
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA,
      1,
      1,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 255, 255]),
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_WRAP_S,
      context.CLAMP_TO_EDGE,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_WRAP_T,
      context.CLAMP_TO_EDGE,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_MIN_FILTER,
      context.LINEAR,
    );
    context.texParameteri(
      context.TEXTURE_2D,
      context.TEXTURE_MAG_FILTER,
      context.LINEAR,
    );
    context.uniform1i(uniforms.u_image ?? null, 0);

    state.reduce = reducedMotion.value === 'reduce';
    state.reveal = props.intro && !state.reduce ? 0 : 1;
    state.alive = true;

    resize();
    draw();
    wake();
    loadSource();
  });

  watch(
    [
      () => props.imageSrc,
      () => props.text,
      () => props.fontFamily,
      () => props.fontWeight,
    ],
    () => {
      if (state.alive) loadSource();
    },
  );

  watch(props, () => {
    if (state.alive) redraw();
  });

  onBeforeUnmount(() => {
    state.alive = false;
    sourceToken++;
    pause();
    if (gl) {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    gl = null;
    program = null;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative size-full', props.class)">
    <canvas ref="canvasRef" class="block size-full" />
  </div>
</template>
