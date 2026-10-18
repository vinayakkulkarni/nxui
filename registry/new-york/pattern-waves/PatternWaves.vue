<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    Mesh,
    Program,
    RenderTarget,
    Renderer,
    Texture,
    Triangle,
  } from 'ogl';
  import {
    DEFAULT_CHARACTERS,
    FADES,
    INTRO_SECONDS,
    PATTERNS,
    PIXEL_BUDGET,
    RIPPLE_CELL,
    RIPPLE_RATE,
    SURFACE_PRESETS,
    WAVES,
    WAVE_UNIT,
    buildAtlas,
    clamp,
    fieldFragment,
    luminance,
    markFragment,
    parseColor,
    passVertex,
    rippleFragment,
  } from './pattern-waves';
  import type {
    PatternWavesProps,
    PatternWavesRgba,
    PatternWavesRippleField,
    PatternWavesSettings,
  } from './types';

  const props = withDefaults(defineProps<PatternWavesProps>(), {
    preset: 'silk',
    pattern: undefined,
    wave: undefined,
    spacing: undefined,
    markSize: undefined,
    depth: undefined,
    light: undefined,
    shine: undefined,
    contrast: undefined,
    speed: undefined,
    scale: undefined,
    direction: undefined,
    color: '#ffffff',
    backgroundColor: '#000000',
    opacity: 1,
    fade: 'edges',
    fadeSize: 0.5,
    characters: '.:-=+*#%@',
    interactive: true,
    cursorSize: 50,
    cursorStrength: 0.6,
    intro: true,
    paused: false,
    class: '',
    style: undefined,
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const reducedMotionPreference = usePreferredReducedMotion();
  const mounted = ref(false);

  const WHITE: PatternWavesRgba = [1, 1, 1, 1];
  const BLACK: PatternWavesRgba = [0, 0, 0, 1];

  const inkColor = computed(() =>
    mounted.value ? parseColor(props.color, WHITE) : WHITE,
  );
  const backgroundRgba = computed(() =>
    mounted.value ? parseColor(props.backgroundColor, BLACK) : BLACK,
  );

  const settings = computed<PatternWavesSettings>(() => {
    const base = SURFACE_PRESETS[props.preset] ?? SURFACE_PRESETS.silk;
    return {
      color: inkColor.value,
      background: backgroundRgba.value,
      pattern: props.pattern ?? base.pattern,
      wave: props.wave ?? base.wave,
      spacing: props.spacing ?? base.spacing,
      markSize: props.markSize ?? base.markSize,
      depth: props.depth ?? base.depth,
      light: props.light ?? base.light,
      shine: props.shine ?? base.shine,
      contrast: props.contrast ?? base.contrast,
      speed: props.speed ?? base.speed,
      scale: props.scale ?? base.scale,
      direction: props.direction ?? base.direction,
      opacity: props.opacity,
      fade: props.fade,
      fadeSize: props.fadeSize,
      characters: props.characters || DEFAULT_CHARACTERS,
      interactive: props.interactive,
      cursorSize: props.cursorSize,
      cursorStrength: props.cursorStrength,
      intro: props.intro,
      paused: props.paused,
    };
  });

  let wake: (() => void) | null = null;
  let teardown: (() => void) | null = null;

  watch(settings, () => wake?.());

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    mounted.value = true;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
    const gl = renderer.gl;
    if (!renderer.isWebgl2 || !(gl instanceof WebGL2RenderingContext)) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const blank = new Texture(gl);
    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');

    const dispose = (target: RenderTarget) => {
      gl.deleteFramebuffer(target.buffer);
      gl.deleteTexture(target.texture.texture);
    };

    const fieldTargetFor = (w: number, h: number) =>
      new RenderTarget(gl, {
        width: w,
        height: h,
        depth: false,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
      });

    const rippleTargetFor = (w: number, h: number) =>
      new RenderTarget(gl, {
        width: w,
        height: h,
        depth: false,
        type: gl.HALF_FLOAT,
        format: gl.RGBA,
        internalFormat: gl.RGBA16F,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      });

    let fieldTarget = fieldTargetFor(1, 1);
    let ripple: PatternWavesRippleField | null = null;

    const atlasTexture = new Texture(gl, {
      generateMipmaps: true,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
      flipY: false,
    });

    const fieldUniforms = {
      uSize: { value: [1, 1] },
      uDpr: { value: 1 },
      uOrigin: { value: [0, 0] },
      uPitch: { value: [1, 1] },
      uWave: { value: 0 },
      uTime: { value: 0 },
      uUnit: { value: WAVE_UNIT },
      uHeading: { value: [1, 0] },
      uAmp: { value: 0 },
      uDepth: { value: 0.5 },
      uLight: { value: [0, 0, 1] },
      uShine: { value: 0.8 },
      uContrast: { value: 1 },
      uInk: { value: 0 },
      uOpacity: { value: 1 },
      uFade: { value: 0 },
      uFadeSize: { value: 0.5 },
      uAppear: { value: 0 },
      tRipple: { value: blank },
      uRipple: { value: 0 },
    };
    const fieldMesh = new Mesh(gl, {
      geometry,
      program: new Program(gl, {
        vertex: passVertex,
        fragment: fieldFragment,
        uniforms: fieldUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    });

    const rippleUniforms = {
      tState: { value: blank },
      uTexel: { value: [1, 1] },
      uSize: { value: [1, 1] },
      uFrom: { value: [0, 0] },
      uTo: { value: [0, 0] },
      uRadius: { value: 40 },
      uImpulse: { value: 0 },
      uDamping: { value: 0.975 },
    };
    const rippleMesh = new Mesh(gl, {
      geometry,
      program: new Program(gl, {
        vertex: passVertex,
        fragment: rippleFragment,
        uniforms: rippleUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    });

    const markUniforms = {
      tField: { value: fieldTarget.texture },
      tAtlas: { value: atlasTexture },
      uOrigin: { value: [0, 0] },
      uPitch: { value: [1, 1] },
      uGrid: { value: [1, 1] },
      uPattern: { value: 0 },
      uMarkSize: { value: 0.9 },
      uStroke: { value: 2 },
      uColor: { value: [1, 1, 1] },
      uAccent: { value: [1, 1, 1] },
      uBackground: { value: [0, 0, 0, 1] },
      uAtlas: { value: [1, 1, 0] },
    };
    const markMesh = new Mesh(gl, {
      geometry,
      program: new Program(gl, {
        vertex: passVertex,
        fragment: markFragment,
        uniforms: markUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    });

    let width = 1;
    let height = 1;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let introClock = 0;
    let visible = true;
    let alive = true;
    let dirty = true;
    let rippleUntil = 0;
    let rippleLive = false;
    let rippleClock = 0;
    let atlasKey = '';
    const pointer = {
      x: 0,
      y: 0,
      inside: false,
      placed: false,
      lastX: 0,
      lastY: 0,
      burst: 0,
    };

    const buildRipple = () => {
      if (!floatTargets) return;
      const w = clamp(Math.ceil(width / RIPPLE_CELL), 4, 512);
      const h = clamp(Math.ceil(height / RIPPLE_CELL), 4, 512);
      if (ripple && ripple.width === w && ripple.height === h) return;
      if (ripple) {
        dispose(ripple.read);
        dispose(ripple.write);
      }
      ripple = {
        width: w,
        height: h,
        read: rippleTargetFor(w, h),
        write: rippleTargetFor(w, h),
      };
      rippleLive = false;
    };

    const clearRipple = () => {
      if (!ripple) return;
      for (const target of [ripple.read, ripple.write]) {
        renderer.bindFramebuffer(target);
        gl.viewport(0, 0, target.width, target.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      renderer.bindFramebuffer();
    };

    const refreshAtlas = (s: PatternWavesSettings) => {
      if (s.characters === atlasKey) return;
      atlasKey = s.characters;
      const built = buildAtlas(s.characters);
      if (!built) return;
      atlasTexture.image = built.canvas;
      markUniforms.uAtlas.value = [built.columns, built.lines, built.count];
    };

    const stepRipple = (
      field: PatternWavesRippleField,
      s: PatternWavesSettings,
      dt: number,
    ) => {
      rippleClock = Math.min(rippleClock + dt * RIPPLE_RATE, 4);
      const strength = clamp(s.cursorStrength, 0, 1);
      const moved = Math.hypot(
        pointer.x - pointer.lastX,
        pointer.y - pointer.lastY,
      );
      let impulse =
        (pointer.inside ? Math.min(moved / 14, 1) * 0.35 * strength : 0) +
        pointer.burst * strength;
      pointer.burst = 0;
      rippleUniforms.uTexel.value = [1 / field.width, 1 / field.height];
      rippleUniforms.uSize.value = [width, height];
      rippleUniforms.uFrom.value = [pointer.lastX, height - pointer.lastY];
      rippleUniforms.uTo.value = [pointer.x, height - pointer.y];
      rippleUniforms.uRadius.value = clamp(s.cursorSize, 8, 400);
      while (rippleClock >= 1) {
        rippleClock -= 1;
        rippleUniforms.tState.value = field.read.texture;
        rippleUniforms.uImpulse.value = impulse;
        renderer.render({
          scene: rippleMesh,
          target: field.write,
          clear: false,
        });
        const next = field.read;
        field.read = field.write;
        field.write = next;
        impulse = 0;
      }
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settings.value;
      const reducedMotion = reducedMotionPreference.value === 'reduce';
      const dt = Math.min(0.05, Math.max(1 / 240, (now - last) / 1000));
      last = now;

      const moving = !s.paused && !reducedMotion && s.speed !== 0;
      if (moving) time += dt * s.speed;
      introClock =
        s.intro && !reducedMotion
          ? Math.min(1, introClock + dt / INTRO_SECONDS)
          : 1;
      const appear = 1 - Math.pow(1 - clamp(introClock / 0.75, 0, 1), 3);
      const rise = clamp((introClock - 0.1) / 0.9, 0, 1);
      const amp = rise * rise * (3 - 2 * rise);

      const rippling =
        s.interactive && !reducedMotion && !!ripple && s.cursorStrength > 0;
      if (rippling && pointer.inside && !pointer.placed) {
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.placed = true;
      }
      if (rippling && (pointer.inside || pointer.burst > 0)) {
        rippleUntil = now + 5000;
      }
      const rippleActive = rippling && now < rippleUntil;
      if (rippleActive && ripple) {
        stepRipple(ripple, s, dt);
        rippleLive = true;
      } else if (rippleLive) {
        clearRipple();
        rippleLive = false;
      }

      const patternIndex = PATTERNS[s.pattern] ?? 0;
      if (patternIndex === 4) refreshAtlas(s);

      const canvasW = gl.canvas.width;
      const canvasH = gl.canvas.height;
      const dpr = canvasW / width;
      const pitchY = Math.max(4, Math.round(clamp(s.spacing, 4, 120) * dpr));
      const pitchX =
        patternIndex === 3 ? Math.max(2, Math.round(pitchY / 4)) : pitchY;
      const cols = Math.min(4096, Math.ceil(canvasW / pitchX) + 1);
      const rows = Math.min(4096, Math.ceil(canvasH / pitchY) + 2);
      const origin = [
        Math.floor((canvasW - cols * pitchX) / 2),
        Math.floor((canvasH - rows * pitchY) / 2),
      ];
      if (fieldTarget.width !== cols || fieldTarget.height !== rows) {
        dispose(fieldTarget);
        fieldTarget = fieldTargetFor(cols, rows);
        markUniforms.tField.value = fieldTarget.texture;
      }
      const heading = (s.direction * Math.PI) / 180;
      const lightAngle =
        ((s.direction + 180 + clamp(s.light, -90, 90)) * Math.PI) / 180;
      const background = s.background;
      const ink =
        background[3] > 0.02
          ? luminance(s.color) < luminance(background)
          : luminance(s.color) < 0.5;

      fieldUniforms.uSize.value = [width, height];
      fieldUniforms.uDpr.value = dpr;
      fieldUniforms.uOrigin.value = origin;
      fieldUniforms.uPitch.value = [pitchX, pitchY];
      fieldUniforms.uWave.value = WAVES[s.wave] ?? 0;
      fieldUniforms.uTime.value = time;
      fieldUniforms.uUnit.value = WAVE_UNIT * clamp(s.scale, 0.2, 5);
      fieldUniforms.uHeading.value = [Math.cos(heading), Math.sin(heading)];
      fieldUniforms.uAmp.value = amp;
      fieldUniforms.uDepth.value = clamp(s.depth, 0, 1.5);
      fieldUniforms.uLight.value = [
        Math.cos(lightAngle) * 0.78,
        Math.sin(lightAngle) * 0.78,
        0.62,
      ];
      fieldUniforms.uShine.value = clamp(s.shine, 0, 2);
      fieldUniforms.uContrast.value = clamp(s.contrast, 0.3, 3);
      fieldUniforms.uInk.value = ink ? 1 : 0;
      fieldUniforms.uOpacity.value = clamp(s.opacity, 0, 1);
      fieldUniforms.uFade.value = FADES[s.fade] ?? 0;
      fieldUniforms.uFadeSize.value = clamp(s.fadeSize, 0.05, 1);
      fieldUniforms.uAppear.value = appear;
      fieldUniforms.tRipple.value =
        ripple && rippleLive ? ripple.read.texture : blank;
      fieldUniforms.uRipple.value = rippleLive ? 0.32 : 0;
      renderer.render({ scene: fieldMesh, target: fieldTarget });

      markUniforms.uOrigin.value = origin;
      markUniforms.uPitch.value = [pitchX, pitchY];
      markUniforms.uGrid.value = [cols, rows];
      markUniforms.uPattern.value = patternIndex;
      markUniforms.uMarkSize.value = clamp(s.markSize, 0.05, 1);
      markUniforms.uStroke.value =
        patternIndex === 3 ? 0.9 * dpr : Math.max(1.1 * dpr, pitchY * 0.08);
      const tint = ink ? 0 : 1;
      const blend = ink ? 0.35 : 0.55;
      const rgb = s.color.slice(0, 3);
      markUniforms.uColor.value = rgb;
      markUniforms.uAccent.value = rgb.map(
        (channel) => channel + (tint - channel) * blend,
      );
      markUniforms.uBackground.value = background;
      renderer.render({ scene: markMesh });
      dirty = false;

      if (visible && (moving || introClock < 1 || rippleActive || dirty)) {
        raf = requestAnimationFrame(frame);
      }
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.sqrt(PIXEL_BUDGET / (width * height)),
      );
      renderer.setSize(width, height);
      buildRipple();
      dirty = true;
      start();
    };

    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        x,
        y,
        inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const spot = locate(e);
      pointer.x = spot.x;
      pointer.y = spot.y;
      if (spot.inside !== pointer.inside) pointer.placed = false;
      pointer.inside = spot.inside;
      if (spot.inside) start();
    };

    const onPointerDown = (e: PointerEvent) => {
      const spot = locate(e);
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      if (!pointer.inside) {
        pointer.lastX = spot.x;
        pointer.lastY = spot.y;
      }
      pointer.burst = 1.2;
      start();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.placed = false;
      start();
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) onPointerLeave();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') onPointerLeave();
    };

    const onVisibility = () => {
      if (!document.hidden) start();
    };

    const listenerOptions = { passive: true };
    const stops = [
      useEventListener('pointermove', onPointerMove, listenerOptions),
      useEventListener('pointerdown', onPointerDown, listenerOptions),
      useEventListener('pointerout', onPointerOut, listenerOptions),
      useEventListener('pointerup', onPointerUp, listenerOptions),
      useEventListener('blur', onPointerLeave),
      useEventListener(document, 'visibilitychange', onVisibility),
      useResizeObserver(container, resize).stop,
      useIntersectionObserver(container, ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        start();
      }).stop,
    ];

    wake = () => {
      dirty = true;
      start();
    };
    resize();

    teardown = () => {
      alive = false;
      visible = false;
      cancelAnimationFrame(raf);
      for (const stop of stops) stop();
      wake = null;
      if (ripple) {
        dispose(ripple.read);
        dispose(ripple.write);
      }
      dispose(fieldTarget);
      gl.deleteTexture(atlasTexture.texture);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.parentNode?.removeChild(canvas);
    };
  });

  onBeforeUnmount(() => {
    teardown?.();
    teardown = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['pattern-waves relative size-full overflow-hidden', props.class]"
    :style="props.style"
  />
</template>
