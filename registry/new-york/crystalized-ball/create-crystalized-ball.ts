import {
  useEventListener,
  useIntersectionObserver,
  useResizeObserver,
} from '@vueuse/core';
import {
  Geometry,
  Mesh,
  Program,
  RenderTarget,
  Renderer,
  Texture,
  Triangle,
} from 'ogl';
import {
  buildDust,
  buildStrands,
  clamp,
  easeOut,
  seeded,
  smooth,
  wrapAngle,
} from './ball-math';
import {
  GL_HALF_FLOAT,
  GL_RGBA16F,
  GL_RGBA32F,
  INTRO_SECONDS,
  MAX_ARCS,
  MAX_PARTICLES,
  MOTIONS,
  PIXEL_BUDGET,
  SETTLE_SECONDS,
  SHAPES,
  STATE_WIDTH,
} from './presets';
import {
  compositeFragment,
  dustFragment,
  dustVertex,
  fieldFragment,
  passVertex,
  stirFragment,
} from './shaders';
import type {
  CrystalizedBallArc,
  CrystalizedBallDustLayer,
  CrystalizedBallEngine,
  CrystalizedBallSettings,
} from './types';

export function createCrystalizedBall(
  container: HTMLElement,
  getSettings: () => CrystalizedBallSettings,
): CrystalizedBallEngine | null {
  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
  });
  const gl = renderer.gl;
  if (!renderer.isWebgl2) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  const canvas = gl.canvas;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const fullFloat = !!gl.getExtension('EXT_color_buffer_float');
  const halfFloat =
    fullFloat || !!gl.getExtension('EXT_color_buffer_half_float');
  const encode = halfFloat ? 1 : 0.25;
  const geometry = new Triangle(gl);
  const blank = new Texture(gl);
  const strandData = buildStrands();

  const sceneTarget = new RenderTarget(gl, {
    width: 1,
    height: 1,
    depth: false,
    type: halfFloat ? GL_HALF_FLOAT : gl.UNSIGNED_BYTE,
    format: gl.RGBA,
    internalFormat: halfFloat ? GL_RGBA16F : gl.RGBA,
    minFilter: gl.NEAREST,
    magFilter: gl.NEAREST,
  });

  const arcData: number[] = Array.from({ length: MAX_ARCS * 4 }, () => 0);
  const fieldUniforms = {
    uCenter: { value: [0, 0] },
    uRadius: { value: 1 },
    uDpr: { value: 1 },
    uLine: { value: 0.6 },
    uTime: { value: 0 },
    uFrame: { value: 0 },
    uBins: { value: 420 },
    uStrands: { value: 5 },
    uCrackle: { value: 0.6 },
    uFlares: { value: 0.5 },
    uGlow: { value: 0.8 },
    uHaze: { value: 0.7 },
    uFill: { value: 0.5 },
    uPresence: { value: 0 },
    uUnfold: { value: 0 },
    uBloom: { value: 0 },
    uInside: { value: 0 },
    uEncode: { value: encode },
    uRim: { value: [1, 1, 1] },
    uRimHot: { value: [1, 1, 1] },
    uRimMid: { value: [1, 1, 1] },
    uRimDeep: { value: [1, 1, 1] },
    uSpark: { value: [1, 1, 1] },
    uSparkGlow: { value: [1, 1, 1] },
    uHazeColor: { value: [0, 0, 0] },
    uEdgeColor: { value: [0, 0, 0] },
    uHeat: { value: [0, 0, 0, 0] },
    uHarmonics: { value: strandData.harmonics },
    uRates: { value: strandData.rates },
    uPhases: { value: strandData.phases },
    uFlareHarmonics: { value: strandData.flareHarmonics },
    uFlareRates: { value: strandData.flareRates },
    uFlarePhases: { value: strandData.flarePhases },
    uArcs: { value: arcData },
  };

  const dustShared = {
    uDustTime: { value: 0 },
    uTurn: { value: [0, 0] },
    uMotion: { value: 0 },
    uFill: fieldUniforms.uFill,
    tHome: { value: blank },
    tSeed: { value: blank },
  };

  const dustUniforms = {
    ...dustShared,
    tOffset: { value: blank },
    uStirred: { value: 0 },
    uCenter: fieldUniforms.uCenter,
    uViewport: { value: [1, 1] },
    uRadius: fieldUniforms.uRadius,
    uDpr: fieldUniforms.uDpr,
    uDepth: { value: 0.6 },
    uTwinkle: { value: 0.5 },
    uPointScale: { value: 1 },
    uReveal: { value: 0 },
    uEncode: { value: encode },
    uTones: { value: Array.from({ length: 15 }, () => 1) },
    uRimTone: { value: [1, 1, 1] },
    uShape: { value: 0 },
  };

  const stirUniforms = {
    ...dustShared,
    tOffset: { value: blank },
    tVelocity: { value: blank },
    uDt: { value: 0.016 },
    uReset: { value: 1 },
    uBrush: { value: [0, 0, 0, 0] },
    uBrushPower: { value: 0 },
    uKick: { value: [0, 0, 0, 0] },
  };

  const compositeUniforms = {
    tScene: { value: sceneTarget.texture },
    uLight: { value: 0 },
    uDecode: { value: 1 / encode },
  };

  const additive = (program: Program) => {
    program.setBlendFunc(gl.ONE, gl.ONE);
    return program;
  };

  const fieldMesh = new Mesh(gl, {
    geometry,
    program: additive(
      new Program(gl, {
        vertex: passVertex,
        fragment: fieldFragment,
        uniforms: fieldUniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    ),
  });
  const dustProgram = additive(
    new Program(gl, {
      vertex: dustVertex,
      fragment: dustFragment,
      uniforms: dustUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  const stirMesh = halfFloat
    ? new Mesh(gl, {
        geometry,
        program: new Program(gl, {
          vertex: passVertex,
          fragment: stirFragment,
          uniforms: stirUniforms,
          depthTest: false,
          depthWrite: false,
        }),
      })
    : null;
  const compositeMesh = new Mesh(gl, {
    geometry,
    program: new Program(gl, {
      vertex: passVertex,
      fragment: compositeFragment,
      uniforms: compositeUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  });

  const disposeTarget = (target: RenderTarget | null) => {
    if (!target) return;
    gl.deleteFramebuffer(target.buffer);
    target.textures.forEach((texture) => gl.deleteTexture(texture.texture));
  };

  const stateTarget = (rows: number) =>
    new RenderTarget(gl, {
      width: STATE_WIDTH,
      height: rows,
      color: 2,
      depth: false,
      type: fullFloat ? gl.FLOAT : GL_HALF_FLOAT,
      format: gl.RGBA,
      internalFormat: fullFloat ? GL_RGBA32F : GL_RGBA16F,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
    });

  const dataTexture = (data: Float32Array, rows: number) =>
    new Texture(gl, {
      image: data,
      width: STATE_WIDTH,
      height: rows,
      type: gl.FLOAT,
      format: gl.RGBA,
      internalFormat: GL_RGBA32F,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    });

  const random = seeded(913);

  let dust: CrystalizedBallDustLayer | null = null;
  let width = 1;
  let height = 1;
  let raf = 0;
  let last = performance.now();
  let rimTime = 0;
  let dustTime = 0;
  let swayClock = 0;
  let introClock = 0;
  let visible = true;
  let alive = true;
  let surge = 0;
  let stirring = 0;
  let stirEnergy = 0;
  let kick: { x: number; y: number; strength: number } | null = null;
  let nextArc = 0.3;
  const arcs: CrystalizedBallArc[] = [];
  const pointer = { x: 0, y: 0, inside: false, fresh: true };
  const heat = { angle: 0, velocity: 0, power: 0, near: 0 };
  const brush = { x: 0, y: 0, vx: 0, vy: 0 };
  const look = { x: 0, y: 0, vx: 0, vy: 0 };

  const disposeDust = () => {
    if (!dust) return;
    dust.mesh.geometry.remove();
    gl.deleteTexture(dust.home.texture);
    gl.deleteTexture(dust.seed.texture);
    disposeTarget(dust.read);
    disposeTarget(dust.write);
    dust = null;
  };

  const resetStir = () => {
    if (!stirMesh || !dust || !dust.read || !dust.write) return;
    stirUniforms.tOffset.value = blank;
    stirUniforms.tVelocity.value = blank;
    stirUniforms.uReset.value = 1;
    renderer.render({ scene: stirMesh, target: dust.read, clear: false });
    renderer.render({ scene: stirMesh, target: dust.write, clear: false });
    stirUniforms.uReset.value = 0;
  };

  const rebuildDust = (requested: number) => {
    const total = clamp(Math.round(requested / 100) * 100, 0, MAX_PARTICLES);
    if (dust && dust.requested === total) return;
    disposeDust();
    if (!total) return;
    const data = buildDust(total);
    const indices = new Float32Array(data.count);
    for (let i = 0; i < data.count; i++) indices[i] = i;
    const points = new Geometry(gl, { aIndex: { size: 1, data: indices } });
    dust = {
      requested: total,
      rows: data.rows,
      home: dataTexture(data.home, data.rows),
      seed: dataTexture(data.seed, data.rows),
      mesh: new Mesh(gl, {
        mode: gl.POINTS,
        geometry: points,
        program: dustProgram,
      }),
      read: stirMesh ? stateTarget(data.rows) : null,
      write: stirMesh ? stateTarget(data.rows) : null,
    };
    dustShared.tHome.value = dust.home;
    dustShared.tSeed.value = dust.seed;
    resetStir();
    stirring = 0;
  };

  const ballRadius = (size: number) =>
    Math.max(8, (clamp(size, 0.1, 1.5) * Math.min(width, height)) / 2);

  const spawnArc = (angle: number, strength: number) => {
    if (arcs.length >= MAX_ARCS) return;
    arcs.push({
      start: angle,
      span: (0.05 + random() * 0.07) * (random() < 0.5 ? -1 : 1),
      curl: 0.02 + random() * 0.04,
      life: 0,
      duration: 0.2 + random() * 0.2,
      drift: (random() - 0.5) * 0.3,
      strength,
    });
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const s = getSettings();
    const dt = Math.min(0.05, Math.max(1 / 240, (now - last) / 1000));
    last = now;

    const reducedMotion = s.reducedMotion;
    const moving = !s.paused && !reducedMotion;
    introClock =
      s.intro && !reducedMotion
        ? Math.min(1, introClock + dt / INTRO_SECONDS)
        : 1;
    const presence = easeOut(smooth(0, 0.42, introClock));
    const unfold = easeOut(smooth(0, 0.32, introClock));
    const charge = Math.sin(Math.PI * smooth(0.22, 0.78, introClock)) * 0.35;
    const radius = ballRadius(s.size);

    const strength =
      s.interactive && !reducedMotion ? clamp(s.hoverStrength, 0, 1) : 0;
    const px = pointer.x - width / 2;
    const py = height / 2 - pointer.y;
    const reach = Math.hypot(px, py);
    const target = pointer.inside ? strength : 0;
    if (heat.power < 0.02) {
      heat.angle = Math.atan2(py, px);
      heat.velocity = 0;
    }
    const turn = wrapAngle(Math.atan2(py, px) - heat.angle);
    heat.velocity += (120 * turn - 19 * heat.velocity) * dt;
    heat.angle = wrapAngle(heat.angle + heat.velocity * dt);
    heat.power +=
      (target - heat.power) *
      (1 - Math.exp(-dt / (target > heat.power ? 0.3 : 0.55)));
    const nearTarget = Math.exp(
      -Math.pow((reach - radius) / (radius * 0.45), 2),
    );
    heat.near += (nearTarget - heat.near) * (1 - Math.exp(-dt / 0.15));
    surge *= Math.exp(-dt / 0.7);

    const bx = px / radius;
    const by = py / radius;
    if (Math.hypot(bx - brush.x, by - brush.y) > 0.6) pointer.fresh = true;
    if (pointer.fresh) {
      brush.x = bx;
      brush.y = by;
      brush.vx = 0;
      brush.vy = 0;
      pointer.fresh = false;
    }
    const follow = 1 - Math.exp(-dt / 0.05);
    brush.vx += ((bx - brush.x) / dt - brush.vx) * follow;
    brush.vy += ((by - brush.y) / dt - brush.vy) * follow;
    brush.x = bx;
    brush.y = by;
    const brushSpeed = Math.hypot(brush.vx, brush.vy);
    const cap = brushSpeed > 4 ? 4 / brushSpeed : 1;
    const inBall = Math.exp(-Math.max(0, Math.hypot(bx, by) - 1) * 6);
    const brushPower = pointer.inside ? strength * inBall * presence : 0;
    stirEnergy =
      stirEnergy * Math.exp(-dt / 1.2) +
      brushPower * Math.min(brushSpeed, 4) * dt;

    if (moving) {
      const pace = 1 + surge * 0.6 + heat.power * heat.near * 0.3;
      const step = dt * Math.max(0, s.speed) * 2 * pace;
      rimTime += step;
      dustTime += dt * Math.max(0, s.dustSpeed) * (1 + surge * 0.4);
      swayClock += dt * Math.max(0, s.dustSpeed);
      const crackleNow = clamp(s.crackle + surge * 0.5, 0, 1.5);
      if (s.sparks > 0.01 && introClock > 0.55) {
        nextArc -= step * s.sparks * 2 * (0.6 + crackleNow * 0.6);
        if (nextArc <= 0) {
          const local = heat.power * heat.near;
          const angle =
            random() < local * 0.7
              ? heat.angle + (random() - 0.5) * 0.8
              : random() < 0.7
                ? Math.PI / 2 + (random() - 0.5) * 1.5
                : random() * Math.PI * 2;
          spawnArc(angle, 0.8 + local * 0.6 + surge * 0.4);
          nextArc = 0.15 + random() * 0.6;
        }
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i]!;
        arc.life += step;
        arc.start += arc.drift * step;
        if (arc.life >= arc.duration) arcs.splice(i, 1);
      }
    } else {
      arcs.length = 0;
    }
    for (let i = 0; i < MAX_ARCS; i++) {
      const arc = arcs[i];
      arcData[i * 4] = arc ? arc.start : 0;
      arcData[i * 4 + 1] = arc ? arc.span : 0;
      arcData[i * 4 + 2] = arc ? arc.curl : 0;
      arcData[i * 4 + 3] = arc
        ? Math.sin((Math.PI * arc.life) / arc.duration) * arc.strength
        : 0;
    }

    rebuildDust(s.particleCount);
    const palette = s.palette;

    fieldUniforms.uCenter.value = [width / 2, height / 2];
    fieldUniforms.uRadius.value = radius;
    fieldUniforms.uDpr.value = renderer.dpr;
    fieldUniforms.uLine.value = Math.max(0.6, radius * 0.0035);
    fieldUniforms.uTime.value = rimTime;
    fieldUniforms.uFrame.value = Math.floor(rimTime * 24) % 100000;
    fieldUniforms.uBins.value = clamp(
      Math.round((Math.PI * 2 * radius) / 2.6),
      240,
      900,
    );
    fieldUniforms.uStrands.value = Math.round(clamp(s.strands, 1, 8));
    fieldUniforms.uCrackle.value =
      clamp(s.crackle, 0, 1) + surge * 0.5 + charge;
    fieldUniforms.uFlares.value = clamp(s.flares, 0, 1);
    fieldUniforms.uGlow.value =
      clamp(s.glow, 0, 2) * (1 + surge * 0.5 + charge) * (s.light ? 0.35 : 1);
    fieldUniforms.uHaze.value = clamp(s.haze, 0, 2) * (s.light ? 0.6 : 1);
    fieldUniforms.uFill.value = clamp(s.fill, 0, 1);
    fieldUniforms.uPresence.value = presence;
    fieldUniforms.uUnfold.value = unfold;
    fieldUniforms.uBloom.value = presence * presence;
    fieldUniforms.uInside.value = smooth(0.2, 0.95, introClock);
    fieldUniforms.uRim.value = palette.rim;
    fieldUniforms.uRimHot.value = palette.rimHot;
    fieldUniforms.uRimMid.value = palette.rimMid;
    fieldUniforms.uRimDeep.value = palette.rimDeep;
    fieldUniforms.uSpark.value = palette.spark;
    fieldUniforms.uSparkGlow.value = palette.sparkGlow;
    fieldUniforms.uHazeColor.value = palette.haze;
    fieldUniforms.uEdgeColor.value = palette.edge;
    fieldUniforms.uHeat.value = [
      heat.angle,
      heat.near,
      heat.power * presence,
      0,
    ];

    dustShared.uDustTime.value = dustTime;
    const gaze = pointer.inside ? strength * presence : 0;
    const lookX = clamp(bx, -1.6, 1.6) * gaze;
    const lookY = clamp(by, -1.6, 1.6) * gaze;
    look.vx += (40 * (lookX - look.x) - 11 * look.vx) * dt;
    look.vy += (40 * (lookY - look.y) - 11 * look.vy) * dt;
    look.x += look.vx * dt;
    look.y += look.vy * dt;
    const swing = clamp(s.sway, 0, 1);
    dustShared.uTurn.value = [
      swing * 0.42 * Math.sin(swayClock * 0.23) + look.x * 0.3,
      swing * 0.12 * Math.sin(swayClock * 0.17 + 1.3) - look.y * 0.16,
    ];
    dustShared.uMotion.value = MOTIONS[s.motion] ?? 0;
    dustUniforms.uViewport.value = [width, height];
    dustUniforms.uDepth.value = clamp(s.depth, 0, 1);
    dustUniforms.uTwinkle.value = clamp(s.twinkle, 0, 1);
    dustUniforms.uPointScale.value = Math.max(1, radius / 491);
    dustUniforms.uReveal.value = smooth(0.18, 1, introClock);
    dustUniforms.uTones.value = palette.tones.flat();
    dustUniforms.uRimTone.value = palette.rim;
    dustUniforms.uShape.value = SHAPES[s.particleShape] ?? 0;

    const layer = dust;
    if (layer && stirMesh && (stirEnergy > 0.002 || kick))
      stirring = SETTLE_SECONDS;
    let stirred = false;
    if (layer && layer.read && layer.write && stirMesh && stirring > 0) {
      stirUniforms.uDt.value = Math.min(dt, 1 / 30);
      stirUniforms.uBrush.value = [
        brush.x,
        brush.y,
        brush.vx * cap,
        brush.vy * cap,
      ];
      stirUniforms.uBrushPower.value = brushPower;
      stirUniforms.uKick.value = kick
        ? [kick.x, kick.y, kick.strength, 0]
        : [0, 0, 0, 0];
      stirUniforms.tOffset.value = layer.read.textures[0] ?? blank;
      stirUniforms.tVelocity.value = layer.read.textures[1] ?? blank;
      renderer.render({ scene: stirMesh, target: layer.write, clear: false });
      const swap = layer.read;
      layer.read = layer.write;
      layer.write = swap;
      stirring -= dt;
      stirred = stirring > 0;
      if (!stirred) {
        stirring = 0;
        resetStir();
      }
    }
    kick = null;
    dustUniforms.uStirred.value = stirred ? 1 : 0;
    dustUniforms.tOffset.value =
      layer && layer.read ? (layer.read.textures[0] ?? blank) : blank;

    gl.clearColor(0, 0, 0, 0);
    renderer.render({ scene: fieldMesh, target: sceneTarget, clear: true });
    if (dust)
      renderer.render({ scene: dust.mesh, target: sceneTarget, clear: false });

    compositeUniforms.uLight.value = s.light ? 1 : 0;
    renderer.render({ scene: compositeMesh, clear: false });

    const settling =
      Math.abs(target - heat.power) > 0.002 ||
      surge > 0.002 ||
      stirring > 0 ||
      Math.abs(heat.velocity) > 0.01 ||
      Math.hypot(look.vx, look.vy, look.x - lookX, look.y - lookY) > 0.001;
    if (visible && (moving || introClock < 1 || settling))
      raf = requestAnimationFrame(frame);
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
    sceneTarget.setSize(gl.canvas.width, gl.canvas.height);
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
    if (spot.inside && !pointer.inside) pointer.fresh = true;
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.inside = spot.inside;
    if (spot.inside) start();
  };

  const onPointerDown = (e: PointerEvent) => {
    const s = getSettings();
    const spot = locate(e);
    if (!s.interactive || s.reducedMotion || !spot.inside) return;
    if (!pointer.inside) pointer.fresh = true;
    pointer.x = spot.x;
    pointer.y = spot.y;
    pointer.inside = true;
    const radius = ballRadius(s.size);
    const kx = (spot.x - width / 2) / radius;
    const ky = (height / 2 - spot.y) / radius;
    if (Math.hypot(kx, ky) > 1.3) return;
    const strength = clamp(s.hoverStrength, 0, 1);
    kick = { x: kx, y: ky, strength: strength * 1.2 };
    surge = Math.max(surge, strength);
    const angle = Math.atan2(ky, kx);
    spawnArc(angle + (random() - 0.5) * 0.5, 1.3);
    spawnArc(angle + Math.PI + (random() - 0.5) * 1.2, 1.1);
    start();
  };

  const onPointerLeave = () => {
    pointer.inside = false;
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

  const passive = { passive: true };
  const stops = [
    useEventListener('pointermove', onPointerMove, passive),
    useEventListener('pointerdown', onPointerDown, passive),
    useEventListener('pointerout', onPointerOut, passive),
    useEventListener('pointerup', onPointerUp, passive),
    useEventListener('blur', onPointerLeave),
    useEventListener(document, 'visibilitychange', onVisibility),
    useResizeObserver(container, resize).stop,
    useIntersectionObserver(container, ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      start();
    }).stop,
  ];

  resize();

  return {
    wake: start,
    destroy: () => {
      alive = false;
      visible = false;
      cancelAnimationFrame(raf);
      stops.forEach((stop) => stop());
      disposeDust();
      disposeTarget(sceneTarget);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
}
