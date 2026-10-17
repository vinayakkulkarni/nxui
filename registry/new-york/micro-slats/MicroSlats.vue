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
  import { cn } from '~/lib/utils';
  import {
    FLUID_SIZE,
    PIXEL_BUDGET,
    PRESSURE_STEPS,
    SPLASH_JETS,
    SPLAT_FORCE,
    SWELL_PRESETS,
    advectFragment,
    clamp,
    curlFragment,
    divergenceFragment,
    fieldFragment,
    fluidVertex,
    parseColor,
    passVertex,
    pressureFragment,
    projectFragment,
    scaleFragment,
    slatFragment,
    splatFragment,
    vorticityFragment,
  } from './micro-slats';
  import type {
    MicroSlatsFluid,
    MicroSlatsGridLayout,
    MicroSlatsPair,
    MicroSlatsProps,
    MicroSlatsRgba,
    MicroSlatsSettings,
    MicroSlatsSplat,
  } from './types';

  const props = withDefaults(defineProps<MicroSlatsProps>(), {
    preset: 'swell',
    color: '#A855F7',
    glintColor: '#ffffff',
    backgroundColor: '#000000',
    slatWidth: 10,
    slatHeight: 25,
    gap: 3,
    roundness: 0.75,
    scale: undefined,
    speed: undefined,
    direction: undefined,
    chop: undefined,
    stretch: undefined,
    glint: undefined,
    contrast: undefined,
    perspective: undefined,
    fog: undefined,
    interactive: true,
    cursorStrength: 1,
    cursorSize: 40,
    swirl: 0,
    trail: 1.4,
    lean: 0,
    intro: true,
    introDuration: 1.5,
    paused: false,
    class: '',
    style: undefined,
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const reducedMotionPreference = usePreferredReducedMotion();
  const mounted = ref(false);

  const PURPLE: MicroSlatsRgba = [0.66, 0.33, 0.97, 1];
  const WHITE: MicroSlatsRgba = [1, 1, 1, 1];
  const BLACK: MicroSlatsRgba = [0, 0, 0, 1];

  const slatColor = computed(() =>
    mounted.value ? parseColor(props.color, PURPLE) : PURPLE,
  );
  const glintRgba = computed(() =>
    mounted.value ? parseColor(props.glintColor, WHITE) : WHITE,
  );
  const backgroundRgba = computed(() =>
    mounted.value ? parseColor(props.backgroundColor, BLACK) : BLACK,
  );

  const settings = computed<MicroSlatsSettings>(() => {
    const base = SWELL_PRESETS[props.preset] ?? SWELL_PRESETS.swell;
    return {
      color: slatColor.value,
      glintColor: glintRgba.value,
      backgroundColor: backgroundRgba.value,
      slatWidth: props.slatWidth,
      slatHeight: props.slatHeight,
      gap: props.gap,
      roundness: props.roundness,
      scale: props.scale ?? base.scale,
      speed: props.speed ?? base.speed,
      direction: props.direction ?? base.direction,
      chop: props.chop ?? base.chop,
      stretch: props.stretch ?? base.stretch,
      glint: props.glint ?? base.glint,
      contrast: props.contrast ?? base.contrast,
      perspective: props.perspective ?? base.perspective,
      fog: props.fog ?? base.fog,
      interactive: props.interactive,
      cursorStrength: props.cursorStrength,
      cursorSize: props.cursorSize,
      swirl: props.swirl,
      trail: props.trail,
      lean: props.lean,
      intro: props.intro,
      introDuration: props.introDuration,
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
    const floatTargets = !!(
      gl.getExtension('EXT_color_buffer_float') ||
      gl.getExtension('EXT_color_buffer_half_float')
    );

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

    let fieldTarget = fieldTargetFor(1, 1);

    const fieldUniforms = {
      uSize: { value: [1, 1] },
      uGrid: { value: [1, 1, 1, 1] },
      uOrigin: { value: [0, 0] },
      uSlat: { value: [1, 1] },
      uTime: { value: 0 },
      uScale: { value: 1 },
      uDirection: { value: 0 },
      uChop: { value: 0.5 },
      uStretch: { value: 0.3 },
      uGlint: { value: 1 },
      uContrast: { value: 1 },
      uPerspective: { value: 0.7 },
      uFog: { value: 0.5 },
      uIntro: { value: 0 },
      tVelocity: { value: blank },
      tInk: { value: blank },
      uFluidTexel: { value: [1, 1] },
      uFluid: { value: 0 },
      uInk: { value: 1 },
      uLean: { value: 0.5 },
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

    const slatUniforms = {
      tField: { value: fieldTarget.texture },
      uSize: { value: [1, 1] },
      uDpr: { value: 1 },
      uGrid: { value: [1, 1, 1, 1] },
      uOrigin: { value: [0, 0] },
      uSlat: { value: [1, 1] },
      uRound: { value: 1 },
      uTilt: { value: 0 },
      uColor: { value: [1, 1, 1] },
      uGlintColor: { value: [1, 1, 1] },
      uBackground: { value: [0, 0, 0, 1] },
    };
    const slatMesh = new Mesh(gl, {
      geometry,
      program: new Program(gl, {
        vertex: passVertex,
        fragment: slatFragment,
        uniforms: slatUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    });

    const fluidTexel = { value: [1, 1] };
    const fluidPass = (
      fragment: string,
      uniforms: Record<string, { value: unknown }>,
    ) =>
      new Mesh(gl, {
        geometry,
        program: new Program(gl, {
          vertex: fluidVertex,
          fragment,
          uniforms: { uTexel: fluidTexel, ...uniforms },
          depthTest: false,
          depthWrite: false,
        }),
      });

    const splatUniforms = {
      uTarget: { value: blank },
      uAspect: { value: 1 },
      uPoint: { value: [0, 0] },
      uValue: { value: [0, 0, 0] },
      uRadius: { value: 0.01 },
    };
    const curlUniforms = { uVelocity: { value: blank } };
    const vorticityUniforms = {
      uVelocity: { value: blank },
      uCurl: { value: blank },
      uSwirl: { value: 20 },
      uDt: { value: 0.016 },
    };
    const divergenceUniforms = { uVelocity: { value: blank } };
    const pressureUniforms = {
      uPressure: { value: blank },
      uDivergence: { value: blank },
    };
    const projectUniforms = {
      uPressure: { value: blank },
      uVelocity: { value: blank },
    };
    const advectUniforms = {
      uVelocity: { value: blank },
      uSource: { value: blank },
      uDt: { value: 0.016 },
      uFade: { value: 1 },
    };
    const scaleUniforms = { uSource: { value: blank }, uValue: { value: 0 } };

    const splatPass = fluidPass(splatFragment, splatUniforms);
    const curlPass = fluidPass(curlFragment, curlUniforms);
    const vorticityPass = fluidPass(vorticityFragment, vorticityUniforms);
    const divergencePass = fluidPass(divergenceFragment, divergenceUniforms);
    const pressurePass = fluidPass(pressureFragment, pressureUniforms);
    const projectPass = fluidPass(projectFragment, projectUniforms);
    const advectPass = fluidPass(advectFragment, advectUniforms);
    const scalePass = fluidPass(scaleFragment, scaleUniforms);

    let width = 1;
    let height = 1;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let introClock = 0;
    let visible = true;
    let alive = true;
    let fluid: MicroSlatsFluid | null = null;
    let fluidUntil = 0;
    let fluidDirty = false;
    let splashTurn = 0;
    const splats: MicroSlatsSplat[] = [];
    const pointer = { x: 0, y: 0, tracked: false };

    const isReduced = () => reducedMotionPreference.value === 'reduce';

    const run = (mesh: Mesh, target?: RenderTarget) =>
      renderer.render({ scene: mesh, target, clear: false });

    const floatTarget = (w: number, h: number) =>
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

    const swapPair = (w: number, h: number): MicroSlatsPair => ({
      read: floatTarget(w, h),
      write: floatTarget(w, h),
    });

    const swap = (pair: MicroSlatsPair) => {
      const next = pair.read;
      pair.read = pair.write;
      pair.write = next;
    };

    const disposeFluid = () => {
      if (!fluid) return;
      for (const pair of [fluid.velocity, fluid.ink, fluid.pressure]) {
        dispose(pair.read);
        dispose(pair.write);
      }
      dispose(fluid.divergence);
      dispose(fluid.curl);
      fluid = null;
    };

    const buildFluid = () => {
      if (!floatTargets) return;
      const aspect = width / height;
      const w = Math.max(
        8,
        Math.round(aspect >= 1 ? FLUID_SIZE * aspect : FLUID_SIZE),
      );
      const h = Math.max(
        8,
        Math.round(aspect >= 1 ? FLUID_SIZE : FLUID_SIZE / aspect),
      );
      if (fluid && fluid.width === w && fluid.height === h) return;
      disposeFluid();
      fluid = {
        width: w,
        height: h,
        velocity: swapPair(w, h),
        ink: swapPair(w, h),
        pressure: swapPair(w, h),
        divergence: floatTarget(w, h),
        curl: floatTarget(w, h),
      };
      fluidTexel.value = [1 / w, 1 / h];
    };

    const layout = (s: MicroSlatsSettings): MicroSlatsGridLayout => {
      const slatW = clamp(s.slatWidth, 1, 64);
      const slatH = clamp(s.slatHeight, 2, 240);
      const gapSize = clamp(s.gap, 0, 64);
      const pitchX = slatW + gapSize;
      const pitchY = slatH + gapSize;
      const cols = Math.min(2048, Math.ceil((width + gapSize) / pitchX) + 1);
      const rows = Math.min(2048, Math.ceil((height + gapSize) / pitchY) + 1);
      const originX = (width - (cols * pitchX - gapSize)) / 2;
      const originY = (height - (rows * pitchY - gapSize)) / 2;
      if (fieldTarget.width !== cols || fieldTarget.height !== rows) {
        dispose(fieldTarget);
        fieldTarget = fieldTargetFor(cols, rows);
        slatUniforms.tField.value = fieldTarget.texture;
      }
      const tilt = Math.min(
        0.42,
        Math.asin(clamp((pitchX * 1.5 - slatW * 0.5) / (slatH * 0.5), 0, 1)),
      );
      return {
        slatW,
        slatH,
        tilt,
        grid: [cols, rows, pitchX, pitchY],
        origin: [originX, originY],
      };
    };

    const splat = (
      pair: MicroSlatsPair,
      point: number[],
      value: number[],
      radius: number,
    ) => {
      splatUniforms.uTarget.value = pair.read.texture;
      splatUniforms.uAspect.value = width / height;
      splatUniforms.uPoint.value = point;
      splatUniforms.uValue.value = value;
      splatUniforms.uRadius.value = radius;
      run(splatPass, pair.write);
      swap(pair);
    };

    const stepFluid = (
      f: MicroSlatsFluid,
      dt: number,
      s: MicroSlatsSettings,
    ) => {
      if (s.swirl > 0) {
        curlUniforms.uVelocity.value = f.velocity.read.texture;
        run(curlPass, f.curl);

        vorticityUniforms.uVelocity.value = f.velocity.read.texture;
        vorticityUniforms.uCurl.value = f.curl.texture;
        vorticityUniforms.uSwirl.value = clamp(s.swirl, 0, 2) * 40;
        vorticityUniforms.uDt.value = dt;
        run(vorticityPass, f.velocity.write);
        swap(f.velocity);
      }

      divergenceUniforms.uVelocity.value = f.velocity.read.texture;
      run(divergencePass, f.divergence);

      scaleUniforms.uSource.value = f.pressure.read.texture;
      scaleUniforms.uValue.value = 0.8;
      run(scalePass, f.pressure.write);
      swap(f.pressure);

      pressureUniforms.uDivergence.value = f.divergence.texture;
      for (let i = 0; i < PRESSURE_STEPS; i++) {
        pressureUniforms.uPressure.value = f.pressure.read.texture;
        run(pressurePass, f.pressure.write);
        swap(f.pressure);
      }

      projectUniforms.uPressure.value = f.pressure.read.texture;
      projectUniforms.uVelocity.value = f.velocity.read.texture;
      run(projectPass, f.velocity.write);
      swap(f.velocity);

      const fade = 1 / clamp(s.trail, 0.1, 10);
      advectUniforms.uDt.value = dt;
      advectUniforms.uVelocity.value = f.velocity.read.texture;
      advectUniforms.uSource.value = f.velocity.read.texture;
      advectUniforms.uFade.value = fade * 1.4;
      run(advectPass, f.velocity.write);
      swap(f.velocity);

      advectUniforms.uVelocity.value = f.velocity.read.texture;
      advectUniforms.uSource.value = f.ink.read.texture;
      advectUniforms.uFade.value = fade;
      run(advectPass, f.ink.write);
      swap(f.ink);
    };

    const clearFluid = (f: MicroSlatsFluid) => {
      scaleUniforms.uValue.value = 0;
      for (const pair of [f.velocity, f.ink, f.pressure]) {
        scaleUniforms.uSource.value = pair.read.texture;
        run(scalePass, pair.write);
        swap(pair);
      }
    };

    const applySplats = (f: MicroSlatsFluid, s: MicroSlatsSettings) => {
      const radius = Math.pow(clamp(s.cursorSize, 4, 600) / height, 2) * 0.35;
      const aspect = width / height;
      for (const [u, v, du, dv, turn] of splats) {
        if (turn === null) {
          splat(
            f.velocity,
            [u, v],
            [du * SPLAT_FORCE, dv * SPLAT_FORCE, 0],
            radius,
          );
          splat(f.ink, [u, v], [0.13, 0, 0], radius);
          continue;
        }
        const jet = radius * 0.55;
        const reach = Math.sqrt(jet * 0.5) * 1.9;
        const push = SPLAT_FORCE * 0.08;
        for (let i = 0; i < SPLASH_JETS; i++) {
          const angle = turn + (i / SPLASH_JETS) * Math.PI * 2;
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);
          const point = [u + (dx * reach) / aspect, v + dy * reach];
          const spin = [
            (dx - dy) * Math.SQRT1_2 * push,
            (dy + dx) * Math.SQRT1_2 * push,
            0,
          ];
          splat(f.velocity, point, spin, jet);
          splat(f.ink, point, [0.75, 0, 0], jet);
        }
        splat(f.ink, [u, v], [0.45, 0, 0], radius);
      }
      splats.length = 0;
      fluidDirty = true;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = settings.value;
      const reducedMotion = isReduced();
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      if (!s.paused && !reducedMotion) time += dt * s.speed;
      introClock =
        s.intro && !reducedMotion
          ? introClock + dt / Math.max(0.2, s.introDuration)
          : 1;
      const introLinear = Math.min(introClock, 1);
      const introEase =
        introLinear < 0.5
          ? 4 * introLinear * introLinear * introLinear
          : 1 - Math.pow(-2 * introLinear + 2, 3) / 2;

      if (fluid && splats.length) applySplats(fluid, s);
      const fluidActive = fluid !== null && now < fluidUntil;
      if (fluid) {
        if (fluidActive) {
          stepFluid(fluid, Math.min(Math.max(dt, 1 / 240), 1 / 30), s);
        } else if (fluidDirty) {
          clearFluid(fluid);
          fluidDirty = false;
        }
      }

      const grid = layout(s);

      fieldUniforms.uSize.value = [width, height];
      fieldUniforms.uGrid.value = grid.grid;
      fieldUniforms.uOrigin.value = grid.origin;
      fieldUniforms.uSlat.value = [grid.slatW, grid.slatH];
      fieldUniforms.uTime.value = time;
      fieldUniforms.uScale.value = s.scale;
      fieldUniforms.uDirection.value = (s.direction * Math.PI) / 180;
      fieldUniforms.uChop.value = clamp(s.chop, 0, 1.5);
      fieldUniforms.uStretch.value = clamp(s.stretch, 0, 0.95);
      fieldUniforms.uGlint.value = Math.max(0, s.glint);
      fieldUniforms.uContrast.value = clamp(s.contrast, 0.2, 4);
      fieldUniforms.uPerspective.value = clamp(s.perspective, 0, 1);
      fieldUniforms.uFog.value = clamp(s.fog, 0, 1);
      fieldUniforms.uIntro.value = introEase;
      fieldUniforms.uFluid.value = fluidActive ? 1 : 0;
      fieldUniforms.tVelocity.value = fluid
        ? fluid.velocity.read.texture
        : blank;
      fieldUniforms.tInk.value = fluid ? fluid.ink.read.texture : blank;
      fieldUniforms.uFluidTexel.value = fluidTexel.value;
      fieldUniforms.uInk.value = clamp(s.cursorStrength, 0, 3);
      fieldUniforms.uLean.value = clamp(s.lean, 0, 1);
      renderer.render({ scene: fieldMesh, target: fieldTarget });

      slatUniforms.uSize.value = [width, height];
      slatUniforms.uDpr.value = renderer.dpr;
      slatUniforms.uGrid.value = grid.grid;
      slatUniforms.uOrigin.value = grid.origin;
      slatUniforms.uSlat.value = [grid.slatW, grid.slatH];
      slatUniforms.uRound.value = clamp(s.roundness, 0, 1);
      slatUniforms.uTilt.value = fluidActive && s.lean > 0 ? grid.tilt : 0;
      slatUniforms.uColor.value = s.color.slice(0, 3);
      slatUniforms.uGlintColor.value = s.glintColor.slice(0, 3);
      slatUniforms.uBackground.value = s.backgroundColor;
      renderer.render({ scene: slatMesh });

      const moving =
        (!s.paused && !reducedMotion && s.speed !== 0) || introClock < 1;
      if (visible && (moving || fluidActive || fluidDirty)) {
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
      buildFluid();
      start();
    };

    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      return {
        x,
        y,
        u: x / w,
        v: 1 - y / h,
        h,
        inside: x >= 0 && y >= 0 && x <= w && y <= h,
      };
    };

    const queue = (
      u: number,
      v: number,
      du: number,
      dv: number,
      turn: number | null,
    ) => {
      if (splats.length > 32) splats.shift();
      splats.push([u, v, du, dv, turn]);
      fluidUntil =
        performance.now() + Math.max(1.5, settings.value.trail * 5) * 1000;
      start();
    };

    const canStir = (inside: boolean) =>
      !!fluid && settings.value.interactive && !isReduced() && inside;

    const onPointerMove = (e: PointerEvent) => {
      const spot = locate(e);
      if (!canStir(spot.inside)) {
        pointer.tracked = false;
        return;
      }
      if (pointer.tracked && (spot.x !== pointer.x || spot.y !== pointer.y)) {
        queue(
          spot.u,
          spot.v,
          (spot.x - pointer.x) / spot.h,
          (pointer.y - spot.y) / spot.h,
          null,
        );
      }
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.tracked = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      const spot = locate(e);
      if (!canStir(spot.inside)) return;
      splashTurn += 2.39996;
      queue(spot.u, spot.v, 0, 0, splashTurn);
    };

    const onPointerLeave = () => {
      pointer.tracked = false;
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) onPointerLeave();
    };

    const onVisibility = () => {
      if (!document.hidden) start();
    };

    const listenerOptions = { passive: true };
    const stops = [
      useEventListener('pointermove', onPointerMove, listenerOptions),
      useEventListener('pointerdown', onPointerDown, listenerOptions),
      useEventListener('pointerout', onPointerOut, listenerOptions),
      useEventListener('blur', onPointerLeave),
      useEventListener(document, 'visibilitychange', onVisibility),
      useResizeObserver(container, resize).stop,
      useIntersectionObserver(container, ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        start();
      }).stop,
    ];

    wake = start;
    resize();

    teardown = () => {
      alive = false;
      visible = false;
      cancelAnimationFrame(raf);
      for (const stop of stops) stop();
      wake = null;
      disposeFluid();
      dispose(fieldTarget);
      gl.deleteTexture(blank.texture);
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
    :class="cn('micro-slats relative size-full overflow-hidden', props.class)"
    :style="props.style"
  />
</template>
