import {
  BLOOM_LEVELS,
  CAMERA,
  DEPTHS,
  FADE,
  FLOATS,
  FOCUS,
  GROWTH,
  INTRO_SECONDS,
  LAYER_SCALES,
  LEVELS,
  MARKER_FLOATS,
  MARKER_PHASES,
  MAX_BANK,
  MAX_RINGS,
  RING_SECONDS,
  SAMPLES,
  SHARD_FOCUS,
  TAU,
  clamp,
  createShards,
  latticeHash,
  rd,
  ribbonPoint,
  smoother,
} from './aero-shards-math';
import {
  bindTarget,
  createProgram,
  createTarget,
  deleteTarget,
  resizeTarget,
  setTexture,
  setVec4,
  uniformAt,
} from './aero-shards-gl';
import {
  BLUR_FRAG,
  COMPOSITE_FRAG,
  DOWNSAMPLE_FRAG,
  FINISH_FRAG,
  FULLSCREEN_VERT,
  LAYER_BLUR_FRAG,
  MARKER_FRAG,
  MARKER_VERT,
  PREFILTER_FRAG,
  SHADOW_FRAG,
  SHARD_FRAG_EDGE,
  SHARD_FRAG_SOLID,
  SHARD_VERT,
} from './shaders';
import type {
  AeroShardsProgram,
  AeroShardsTextureFormat,
} from './aero-shards-gl';
import type {
  AeroShardsEngine,
  AeroShardsEngineOptions,
  AeroShardsGroup,
  AeroShardsLevelPlan,
  AeroShardsPath,
  AeroShardsRing,
  AeroShardsRingSample,
  AeroShardsSettings,
  AeroShardsSpot,
  AeroShardsTarget,
  ShardInstance,
} from './types';

const SEED = 1337;

export function createAeroShardsEngine(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  getSettings: () => AeroShardsSettings,
  options: AeroShardsEngineOptions,
): AeroShardsEngine {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!context) throw new Error('WebGL2 is not available');
  const gl = context;
  const floatTargets = gl.getExtension('EXT_color_buffer_float') !== null;
  const format: AeroShardsTextureFormat = floatTargets
    ? { internal: gl.RGBA16F, type: gl.HALF_FLOAT }
    : { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE };

  const shardSolid = createProgram(gl, SHARD_VERT, SHARD_FRAG_SOLID);
  const shardEdge = createProgram(gl, SHARD_VERT, SHARD_FRAG_EDGE);
  const markerProgram = createProgram(gl, MARKER_VERT, MARKER_FRAG);
  const shadowProgram = createProgram(gl, FULLSCREEN_VERT, SHADOW_FRAG);
  const layerBlurProgram = createProgram(gl, FULLSCREEN_VERT, LAYER_BLUR_FRAG);
  const compositeProgram = createProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG);
  const prefilterProgram = createProgram(gl, FULLSCREEN_VERT, PREFILTER_FRAG);
  const downsampleProgram = createProgram(gl, FULLSCREEN_VERT, DOWNSAMPLE_FRAG);
  const blurProgram = createProgram(gl, FULLSCREEN_VERT, BLUR_FRAG);
  const finishProgram = createProgram(gl, FULLSCREEN_VERT, FINISH_FRAG);
  const programs = [
    shardSolid,
    shardEdge,
    markerProgram,
    shadowProgram,
    layerBlurProgram,
    compositeProgram,
    prefilterProgram,
    downsampleProgram,
    blurProgram,
    finishProgram,
  ];

  const output: [number, number] = [1, 1];
  const sizeFor = (): [number, number] => {
    const ratio = Math.min(options.ratio(), getSettings().dpr);
    return [
      Math.max(1, Math.round(container.clientWidth * ratio)),
      Math.max(1, Math.round(container.clientHeight * ratio)),
    ];
  };
  const groupSize = (scale: number): [number, number] => [
    Math.max(1, Math.round(output[0] * scale)),
    Math.max(1, Math.round(output[1] * scale)),
  ];
  const levelSize = (index: number): [number, number] => [
    Math.max(1, Math.round(output[0] / 2 ** (index + 1))),
    Math.max(1, Math.round(output[1] / 2 ** (index + 1))),
  ];
  const first = sizeFor();
  output[0] = first[0];
  output[1] = first[1];
  canvas.width = output[0];
  canvas.height = output[1];

  const scene = createTarget(gl, format, output, false);
  const bloomLevels = Array.from({ length: BLOOM_LEVELS }, (_, index) => ({
    main: createTarget(gl, format, levelSize(index), false),
    spare: createTarget(gl, format, levelSize(index), false),
  }));
  const groups: AeroShardsGroup[] = LAYER_SCALES.map((scale, index) => ({
    scale,
    layer: createTarget(gl, format, groupSize(scale), true),
    shaded: createTarget(gl, format, groupSize(scale), false),
    temp: createTarget(
      gl,
      format,
      index === 0 ? [1, 1] : groupSize(scale),
      false,
    ),
    blurred: createTarget(
      gl,
      format,
      index === 0 ? [1, 1] : groupSize(scale),
      false,
    ),
    softReady: index !== 0,
  }));
  const allTargets = (): AeroShardsTarget[] => [
    scene,
    ...bloomLevels.flatMap((level) => [level.main, level.spare]),
    ...groups.flatMap((group) => [
      group.layer,
      group.shaded,
      group.temp,
      group.blurred,
    ]),
  ];

  const emptyVao = gl.createVertexArray();
  const shardVao = gl.createVertexArray();
  const markerVao = gl.createVertexArray();
  const shardBuffer = gl.createBuffer();
  const markerBuffer = gl.createBuffer();
  gl.bindVertexArray(shardVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, shardBuffer);
  for (let slot = 0; slot < 6; slot += 1) {
    gl.enableVertexAttribArray(slot);
    gl.vertexAttribDivisor(slot, 1);
  }
  gl.bindVertexArray(markerVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
  for (let slot = 0; slot < 2; slot += 1) {
    gl.enableVertexAttribArray(slot);
    gl.vertexAttribDivisor(slot, 1);
  }
  gl.bindVertexArray(null);

  let capacity = 0;
  let upload = new Float32Array(0);
  let staging = new Float32Array(0);
  let depths = new Float32Array(0);
  const ensureCapacity = (needed: number) => {
    if (needed <= capacity) return;
    capacity = Math.max(needed, 256);
    upload = new Float32Array(capacity * FLOATS);
    staging = new Float32Array(capacity * FLOATS);
    depths = new Float32Array(capacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, shardBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, upload.byteLength, gl.DYNAMIC_DRAW);
  };
  let markerCapacity = 0;
  let markerData = new Float32Array(0);
  const ensureMarkers = (needed: number) => {
    if (needed <= markerCapacity) return;
    const previous = markerData;
    markerCapacity = Math.max(needed, 512);
    markerData = new Float32Array(markerCapacity * MARKER_FLOATS);
    markerData.set(previous);
    gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, markerData.byteLength, gl.DYNAMIC_DRAW);
  };
  ensureMarkers(512);
  ensureCapacity(getSettings().count);

  const paths: AeroShardsPath[] = Array.from({ length: LEVELS }, () => ({
    position: new Float32Array(SAMPLES * 3),
    tangent: new Float32Array(SAMPLES * 3),
    across: new Float32Array(SAMPLES * 3),
    lift: new Float32Array(SAMPLES * 3),
    length: 1,
  }));
  const markerCounts = [0, 0, 0, 0, 0];
  const markerStarts = [0, 0, 0, 0, 0];
  const raw = new Float32Array((SAMPLES + 1) * 3);
  const lengths = new Float32Array(SAMPLES + 1);
  const point = [0, 0, 0];
  let pathKey = '';

  const state = {
    clock: 0,
    last: 0,
    travel: new Float64Array(LEVELS),
    roll: 0,
    twist: 0,
    drift: 0,
    introAt: -1,
    weights: [0, 1, 2, 3].map((index): number =>
      index === getSettings().placement ? 1 : 0,
    ),
    weightVelocity: [0, 0, 0, 0],
    shards: createShards(getSettings().count, SEED),
    order: [] as number[],
    pointer: [0.5, 0.5] as [number, number],
    inside: false,
    presence: 0,
    yaw: 0,
    pitch: 0,
    yawVelocity: 0,
    pitchVelocity: 0,
    pressAt: -1,
    pressPoint: null as [number, number] | null,
    holding: false,
    hold: 0,
    reach: 0,
    gatherCenter: [0, 0, 0] as [number, number, number],
    rings: [] as AeroShardsRing[],
    markerDrift: 0,
    markerTarget: '',
    markerTotal: 0,
    targets: new Map<string, number>(),
    quiet: 0,
    seen: null as AeroShardsSettings | null,
    dirtySize: true,
  };

  const buildPaths = (aspect: number) => {
    const closed = rd(state.weights, 3) > 0.999;
    const key = `${aspect.toFixed(4)}|${state.weights.map((w) => w.toFixed(4)).join(',')}`;
    if (key === pathKey) return closed;
    pathKey = key;
    for (let level = 0; level < LEVELS; level += 1) {
      const path = paths[level];
      if (!path) continue;
      let total = 0;
      for (let i = 0; i <= SAMPLES; i += 1) {
        const s = i / SAMPLES;
        let x = 0;
        let y = 0;
        let z = 0;
        for (let k = 0; k < 4; k += 1) {
          const weight = rd(state.weights, k);
          if (weight < 0.0001) continue;
          ribbonPoint(k, level, s, aspect, point);
          x += rd(point, 0) * weight;
          y += rd(point, 1) * weight;
          z += rd(point, 2) * weight;
        }
        raw[i * 3] = x;
        raw[i * 3 + 1] = y;
        raw[i * 3 + 2] = z;
        if (i > 0) {
          total += Math.hypot(
            x - rd(raw, i * 3 - 3),
            y - rd(raw, i * 3 - 2),
            z - rd(raw, i * 3 - 1),
          );
        }
        lengths[i] = total;
      }
      path.length = Math.max(total, 1e-3);
      let cursor = 0;
      for (let i = 0; i < SAMPLES; i += 1) {
        const want = (i / (SAMPLES - 1)) * total;
        while (cursor < SAMPLES - 1 && rd(lengths, cursor + 1) < want)
          cursor += 1;
        const span = Math.max(
          rd(lengths, cursor + 1) - rd(lengths, cursor),
          1e-6,
        );
        const f = clamp((want - rd(lengths, cursor)) / span, 0, 1);
        for (let c = 0; c < 3; c += 1) {
          const from = rd(raw, cursor * 3 + c);
          path.position[i * 3 + c] =
            from + (rd(raw, cursor * 3 + 3 + c) - from) * f;
        }
      }
      let px = 0;
      let py = 1;
      let pz = 0;
      const pos = path.position;
      for (let i = 0; i < SAMPLES; i += 1) {
        const a = Math.max(0, i - 1);
        const b = Math.min(SAMPLES - 1, i + 1);
        let tx = rd(pos, b * 3) - rd(pos, a * 3);
        let ty = rd(pos, b * 3 + 1) - rd(pos, a * 3 + 1);
        let tz = rd(pos, b * 3 + 2) - rd(pos, a * 3 + 2);
        const tl = Math.hypot(tx, ty, tz) || 1;
        tx /= tl;
        ty /= tl;
        tz /= tl;
        if (i === 0) {
          px = -ty;
          py = tx;
          pz = 0;
        }
        const along = px * tx + py * ty + pz * tz;
        px -= tx * along;
        py -= ty * along;
        pz -= tz * along;
        const pl = Math.hypot(px, py, pz) || 1;
        px /= pl;
        py /= pl;
        pz /= pl;
        path.tangent[i * 3] = tx;
        path.tangent[i * 3 + 1] = ty;
        path.tangent[i * 3 + 2] = tz;
        path.across[i * 3] = px;
        path.across[i * 3 + 1] = py;
        path.across[i * 3 + 2] = pz;
        path.lift[i * 3] = ty * pz - tz * py;
        path.lift[i * 3 + 1] = tz * px - tx * pz;
        path.lift[i * 3 + 2] = tx * py - ty * px;
      }
    }
    return closed;
  };

  const resize = () => {
    const next = sizeFor();
    if (next[0] === output[0] && next[1] === output[1]) return;
    output[0] = next[0];
    output[1] = next[1];
    canvas.width = output[0];
    canvas.height = output[1];
    resizeTarget(gl, scene, format, output);
    for (const group of groups) {
      resizeTarget(gl, group.layer, format, groupSize(group.scale));
      resizeTarget(gl, group.shaded, format, groupSize(group.scale));
      if (group.softReady) {
        resizeTarget(gl, group.temp, format, groupSize(group.scale));
        resizeTarget(gl, group.blurred, format, groupSize(group.scale));
      }
    }
    bloomLevels.forEach((level, index) => {
      resizeTarget(gl, level.main, format, levelSize(index));
      resizeTarget(gl, level.spare, format, levelSize(index));
    });
    state.quiet = 0;
  };

  const cam = {
    eye: [0, 0, CAMERA],
    forward: [0, 0, -1],
    right: [1, 0, 0],
    up: [0, 1, 0],
    focal: 1,
  };

  const updateCamera = (s: AeroShardsSettings) => {
    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);
    cam.eye = [sy * cp * CAMERA, sp * CAMERA, cy * cp * CAMERA];
    const fx = -sy * cp;
    const fy = -sp;
    const fz = -cy * cp;
    cam.forward = [fx, fy, fz];
    const rl = Math.hypot(fz, fx) || 1;
    const rx = -fz / rl;
    const ry = 0;
    const rz = fx / rl;
    cam.right = [rx, ry, rz];
    cam.up = [ry * fz - rz * fy, rz * fx - rx * fz, rx * fy - ry * fx];
    cam.focal = output[1] * 0.5 * CAMERA * s.scale;
  };

  const ray = [0, 0, 1];
  const rayAt = (px: number, py: number) => {
    const x = (px - 0.5) * output[0];
    const y = (0.5 - py) * output[1];
    let r0 =
      rd(cam.forward, 0) * cam.focal + rd(cam.right, 0) * x + rd(cam.up, 0) * y;
    let r1 =
      rd(cam.forward, 1) * cam.focal + rd(cam.right, 1) * x + rd(cam.up, 1) * y;
    let r2 =
      rd(cam.forward, 2) * cam.focal + rd(cam.right, 2) * x + rd(cam.up, 2) * y;
    const length = Math.hypot(r0, r1, r2) || 1;
    r0 /= length;
    r1 /= length;
    r2 /= length;
    ray[0] = r0;
    ray[1] = r1;
    ray[2] = r2;
    return ray;
  };

  const simulate = (s: AeroShardsSettings, dt: number, reduced: boolean) => {
    const [eyeX, eyeY, eyeZ] = [rd(cam.eye, 0), rd(cam.eye, 1), rd(cam.eye, 2)];
    const [fwX, fwY, fwZ] = [
      rd(cam.forward, 0),
      rd(cam.forward, 1),
      rd(cam.forward, 2),
    ];
    const [rtX, rtY, rtZ] = [
      rd(cam.right, 0),
      rd(cam.right, 1),
      rd(cam.right, 2),
    ];
    const [upX, upY, upZ] = [rd(cam.up, 0), rd(cam.up, 1), rd(cam.up, 2)];
    const aspect = output[0] / Math.max(output[1], 1);
    const closed = buildPaths(aspect);
    const introOn = s.intro && !reduced;
    const introAge = state.introAt < 0 ? 0 : state.clock - state.introAt;
    const hover =
      s.mouseInteraction && !reduced ? state.presence * s.mouseStrength : 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    if (hover > 0.001) {
      rayAt(state.pointer[0], state.pointer[1]);
      rx = rd(ray, 0);
      ry = rd(ray, 1);
      rz = rd(ray, 2);
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / Math.max(steps, 1);
    const halfHeight = output[1] * 0.5;
    const rings: AeroShardsRingSample[] = state.rings.map((ring) => {
      const life = ring.age / RING_SECONDS;
      return {
        x: ring.x,
        y: ring.y,
        age: ring.age,
        strength: (1 - Math.exp(-ring.age / 0.06)) * (1 - life) * (1 - life),
      };
    });
    const flat = [0, 0];
    const screenOf = (x: number, y: number, z: number) => {
      const ex = x - eyeX;
      const ey = y - eyeY;
      const ez = z - eyeZ;
      const depth = Math.max(ex * fwX + ey * fwY + ez * fwZ, 0.05);
      flat[0] =
        ((ex * rtX + ey * rtY + ez * rtZ) * cam.focal) / depth / halfHeight;
      flat[1] =
        ((ex * upX + ey * upY + ez * upZ) * cam.focal) / depth / halfHeight;
      return depth;
    };
    const ringBand = (sx: number, sy: number, level: number) => {
      let total = 0;
      for (const ring of rings) {
        const radius = Math.max(0, ring.age - level * 0.07) * 2.3;
        const distance = Math.hypot(sx - ring.x, sy - ring.y);
        total +=
          Math.exp(-((distance - radius) * (distance - radius)) / 0.012) *
          ring.strength;
      }
      return total;
    };
    const shards = state.shards;
    const twistWeight = Math.min(1, s.twist);
    for (let index = 0; index < shards.length; index += 1) {
      const shard = shards[index];
      if (!shard) continue;
      const level = shard.level;
      const path = paths[level];
      if (!path) continue;
      let s0 = (shard.phase + rd(state.travel, level)) % 1;
      let appear = 1;
      let introBank = 0;
      if (introOn) {
        const begin =
          level * 0.22 +
          Math.max(0, s0 - 0.1) * (INTRO_SECONDS - 1.0 - (LEVELS - 1) * 0.22) +
          shard.arrive * 0.15;
        const local = clamp((introAge - begin) / 0.9, 0, 1);
        appear = smoother(local);
        const glide = (1 - local) * (1 - local);
        s0 = closed ? s0 - glide * 0.06 : Math.max(0, s0 - glide * 0.06);
        introBank = glide * 0.9 * shard.sign;
      }
      shard.s = s0;
      const f = (((s0 % 1) + 1) % 1) * (SAMPLES - 1);
      const i0 = Math.floor(f);
      const i1 = Math.min(i0 + 1, SAMPLES - 1);
      const t = f - i0;
      const at = (array: Float32Array, c: number) => {
        const from = rd(array, i0 * 3 + c);
        return from + (rd(array, i1 * 3 + c) - from) * t;
      };
      const cx = at(path.position, 0);
      const cy = at(path.position, 1);
      const cz = at(path.position, 2);
      const tx = at(path.tangent, 0);
      const ty = at(path.tangent, 1);
      const tz = at(path.tangent, 2);
      const ax0 = at(path.across, 0);
      const ay0 = at(path.across, 1);
      const az0 = at(path.across, 2);
      const lx0 = at(path.lift, 0);
      const ly0 = at(path.lift, 1);
      const lz0 = at(path.lift, 2);
      const angle = s.twist * (s0 * TAU * 0.6 + state.twist + level * 1.7);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const ax = ax0 * ca + lx0 * sa;
      const ay = ay0 * ca + ly0 * sa;
      const az = az0 * ca + lz0 * sa;
      const bx = lx0 * ca - ax0 * sa;
      const by = ly0 * ca - ay0 * sa;
      const bz = lz0 * ca - az0 * sa;
      const levelDepth = rd(DEPTHS, level);
      const depthScale = levelDepth / CAMERA;
      const width =
        s.spread *
        (0.15 + 0.035 * levelDepth) *
        (0.8 + 0.3 * Math.sin(s0 * TAU * 1.3 + level * 0.8));
      const lane = shard.lane * width;
      const layer = shard.layer * 0.012 * depthScale;
      const taper = closed
        ? 1
        : smoother(s0 / 0.12) * smoother((1 - s0) / 0.12);
      const billow =
        s.billow *
        0.16 *
        depthScale *
        Math.sin(s0 * TAU * 1.3 - state.drift * 0.5 + level * 1.1) *
        (0.4 + 0.6 * taper);
      const sway =
        s.billow *
        0.06 *
        depthScale *
        Math.sin(s0 * TAU * 0.8 - state.drift * 0.35 + level * 2.4);
      const wobble = 0.009 * depthScale;
      const drift = state.drift;
      const hx =
        cx +
        lx0 * billow +
        ax0 * sway +
        ax * lane +
        bx * layer +
        Math.sin(drift * shard.rate[0] + shard.drift[0]) * wobble;
      const hy =
        cy +
        ly0 * billow +
        ay0 * sway +
        ay * lane +
        by * layer +
        Math.sin(drift * shard.rate[1] + shard.drift[1]) * wobble;
      const hz =
        cz +
        lz0 * billow +
        az0 * sway +
        az * lane +
        bz * layer +
        Math.sin(drift * shard.rate[2] + shard.drift[2]) * wobble;

      let fx = 0;
      let fy = 0;
      let fz = 0;
      let tiltTarget = 0;
      const px = hx + shard.offset[0];
      const py = hy + shard.offset[1];
      const pz = hz + shard.offset[2];
      if (hover > 0.001) {
        const ex = px - eyeX;
        const ey = py - eyeY;
        const ez = pz - eyeZ;
        const along = ex * rx + ey * ry + ez * rz;
        const qx = ex - rx * along;
        const qy = ey - ry * along;
        const qz = ez - rz * along;
        const gap = Math.hypot(qx, qy, qz);
        const reach = (0.24 * depthScale) / s.scale;
        const falloff = Math.exp(-(gap * gap) / (reach * reach));
        if (falloff > 0.002 && gap > 1e-5) {
          const nx = qx / gap;
          const ny = qy / gap;
          const nz = qz / gap;
          const sideways = (nx * tx + ny * ty + nz * tz) * 0.7;
          const strength = hover * falloff * 9 * depthScale;
          fx += (nx - tx * sideways) * strength;
          fy += (ny - ty * sideways) * strength;
          fz += (nz - tz * sideways) * strength;
          tiltTarget +=
            hover * falloff * 1.1 * (nx * ax0 + ny * ay0 + nz * az0);
        }
      }

      if (state.hold > 0.001 && shard.joined) {
        const slot = shard.slot;
        const orbit =
          slot[0] + state.clock * (0.8 / (0.12 + slot[1])) * slot[3];
        const radius = slot[1] / s.scale;
        const gx = state.gatherCenter[0] + Math.cos(orbit) * radius;
        const gy = state.gatherCenter[1] + Math.sin(orbit) * radius * 0.75;
        const gz =
          state.gatherCenter[2] +
          Math.sin(orbit) * radius * 0.45 +
          slot[2] * 0.3;
        shard.gather += (state.hold - shard.gather) * (1 - Math.exp(-dt / 0.3));
        const pull = shard.gather * 30;
        fx += (gx - px) * pull;
        fy += (gy - py) * pull;
        fz += (gz - pz) * pull;
        tiltTarget += shard.gather * 0.6 * Math.sin(orbit);
      } else {
        shard.gather += (0 - shard.gather) * (1 - Math.exp(-dt / 0.2));
      }

      if (rings.length) {
        screenOf(px, py, pz);
        const sx = rd(flat, 0);
        const sy = rd(flat, 1);
        for (const ring of rings) {
          const radius = Math.max(0, ring.age - level * 0.07) * 2.3;
          const dxr = sx - ring.x;
          const dyr = sy - ring.y;
          const distance = Math.hypot(dxr, dyr);
          const band =
            Math.exp(-((distance - radius) * (distance - radius)) / 0.012) *
            ring.strength;
          if (band > 0.01) {
            shard.flash = Math.max(shard.flash, band * 0.75);
            const outward = Math.max(distance, 0.05);
            const ux = (rtX * dxr + upX * dyr) / outward;
            const uy = (rtY * dxr + upY * dyr) / outward;
            const uz = (rtZ * dxr + upZ * dyr) / outward;
            tiltTarget += band * 1.4 * (ux * ax0 + uy * ay0 + uz * az0);
            const push = (band * 2.2 * depthScale) / Math.max(distance, 0.05);
            fx += (rtX * dxr + upX * dyr) * push;
            fy += (rtY * dxr + upY * dyr) * push;
            fz += (rtZ * dxr + upZ * dyr) * push;
          }
        }
      }

      const stiffness = 24 * (1 - shard.gather * 0.95);
      const offset = shard.offset;
      const velocity = shard.velocity;
      for (let step = 0; step < steps; step += 1) {
        velocity[0] += (fx - stiffness * offset[0] - 7.5 * velocity[0]) * h;
        velocity[1] += (fy - stiffness * offset[1] - 7.5 * velocity[1]) * h;
        velocity[2] += (fz - stiffness * offset[2] - 7.5 * velocity[2]) * h;
        offset[0] += velocity[0] * h;
        offset[1] += velocity[1] * h;
        offset[2] += velocity[2] * h;
        shard.tiltVelocity +=
          (90 * (tiltTarget - shard.tilt) - 15 * shard.tiltVelocity) * h;
        shard.tilt += shard.tiltVelocity * h;
      }
      shard.flash *= Math.exp(-dt / 0.45);

      const ox = hx + offset[0];
      const oy = hy + offset[1];
      const oz = hz + offset[2];
      shard.position[0] = ox;
      shard.position[1] = oy;
      shard.position[2] = oz;

      let vx = eyeX - ox;
      let vy = eyeY - oy;
      let vz = eyeZ - oz;
      const vl = Math.hypot(vx, vy, vz) || 1;
      vx /= vl;
      vy /= vl;
      vz /= vl;
      let dx = tx + velocity[0] * 0.05;
      let dy = ty + velocity[1] * 0.05;
      let dz = tz + velocity[2] * 0.05;
      const facingPart = dx * vx + dy * vy + dz * vz;
      dx -= vx * facingPart;
      dy -= vy * facingPart;
      dz -= vz * facingPart;
      let dl = Math.hypot(dx, dy, dz);
      if (dl < 1e-4) {
        dx = rtX;
        dy = rtY;
        dz = rtZ;
        dl = 1;
      }
      dx /= dl;
      dy /= dl;
      dz /= dl;
      const wx = vy * dz - vz * dy;
      const wy = vz * dx - vx * dz;
      const wz = vx * dy - vy * dx;
      const yaw =
        shard.yaw +
        0.05 *
          Math.sin(state.clock * shard.flutter[1] * 0.7 + shard.flutter[0]);
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const kx = dx * cyaw + wx * syaw;
      const ky = dy * cyaw + wy * syaw;
      const kz = dz * cyaw + wz * syaw;
      const jx = wx * cyaw - dx * syaw;
      const jy = wy * cyaw - dy * syaw;
      const jz = wz * cyaw - dz * syaw;
      const wave =
        0.8 * twistWeight * Math.sin(angle) +
        0.3 *
          Math.sin(
            s0 * TAU * 1.6 - state.roll * 0.55 + level * 0.9 + shard.lane * 0.7,
          );
      const flutter =
        0.06 * Math.sin(state.clock * shard.flutter[1] + shard.flutter[0]);
      const bank =
        MAX_BANK *
        Math.tanh(
          (wave + shard.bank + flutter + shard.tilt + introBank) / MAX_BANK,
        );
      const cb = Math.cos(bank);
      const sb = Math.sin(bank);
      const mx = vx * cb + jx * sb;
      const my = vy * cb + jy * sb;
      const mz = vz * cb + jz * sb;
      const pitch =
        shard.pitch +
        0.2 * Math.sin(s0 * TAU * 1.1 - state.roll * 0.4 + level * 2.1);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const axisX = kx * cp + mx * sp;
      const axisY = ky * cp + my * sp;
      const axisZ = kz * cp + mz * sp;
      const nx = mx * cp - kx * sp;
      const ny = my * cp - ky * sp;
      const nz = mz * cp - kz * sp;

      depths[index] = (ox - eyeX) * fwX + (oy - eyeY) * fwY + (oz - eyeZ) * fwZ;
      const core = 1 - 0.45 * shard.lane * shard.lane;
      const size =
        0.062 *
        s.shardSize *
        shard.size *
        rd(GROWTH, level) *
        appear *
        Math.sqrt(taper) *
        core;
      const o = index * FLOATS;
      staging[o] = ox;
      staging[o + 1] = oy;
      staging[o + 2] = oz;
      staging[o + 3] = size > 1e-5 ? size : 0;
      staging[o + 4] = axisX;
      staging[o + 5] = axisY;
      staging[o + 6] = axisZ;
      staging[o + 7] = shard.thickness;
      staging[o + 8] = nx;
      staging[o + 9] = ny;
      staging[o + 10] = nz;
      staging[o + 11] = shard.tint;
      for (let k = 0; k < 10; k += 1) staging[o + 12 + k] = rd(shard.shape, k);
      staging[o + 22] = shard.sides;
      staging[o + 23] = shard.flash;
    }

    let markerTotal = 0;
    for (let level = 0; level < LEVELS; level += 1) {
      markerCounts[level] = 0;
      markerStarts[level] = 0;
    }
    if (s.markers >= 0) {
      const ratio = output[1] / Math.max(container.clientHeight, 1);
      const pointerX = (state.pointer[0] - 0.5) * 2 * aspect;
      const pointerY = (0.5 - state.pointer[1]) * 2;
      const engaged = s.mouseInteraction && !reduced ? state.presence : 0;
      const previousTargets = state.targets;
      const nextTargets = new Map<string, number>();
      const targetEase = 1 - Math.exp(-dt / 0.12);
      let nearestKey = '';
      let nearestGap = 72;
      for (let level = LEVELS - 1; level >= 0; level -= 1) {
        markerStarts[level] = markerTotal;
        const depth = rd(DEPTHS, level);
        const depthScale = depth / CAMERA;
        const spacing = 0.42 * Math.pow(depthScale, 0.55);
        const halfW = ((aspect * depth) / (CAMERA * s.scale)) * 1.12 + spacing;
        const halfH = (depth / (CAMERA * s.scale)) * 1.12 + spacing;
        const drift = state.markerDrift;
        const phase = MARKER_PHASES[level] ?? [0, 0];
        const phaseX = rd(phase, 0);
        const phaseY = rd(phase, 1);
        const i0 = Math.floor((drift - halfW) / spacing - phaseX);
        const i1 = Math.ceil((drift + halfW) / spacing - phaseX);
        const j0 = Math.floor(-halfH / spacing - phaseY);
        const j1 = Math.ceil(halfH / spacing - phaseY);
        const band = s.spread * (0.15 + 0.035 * depth) * 1.4;
        const position = paths[level]?.position ?? raw;
        for (let i = i0; i <= i1; i += 1) {
          for (let j = j0; j <= j1; j += 1) {
            const keep = latticeHash(level, i, j, 11);
            if (keep > 0.5) continue;
            const x = (i + phaseX) * spacing - drift;
            const y = (j + phaseY) * spacing;
            const z = CAMERA - depth;
            const markerDepth = screenOf(x, y, z);
            const sx = rd(flat, 0);
            const sy = rd(flat, 1);
            if (Math.abs(sx) > aspect * 1.05 || Math.abs(sy) > 1.05) continue;
            let best = Infinity;
            for (let k = 0; k < SAMPLES; k += 2) {
              const ddx = x - rd(position, k * 3);
              const ddy = y - rd(position, k * 3 + 1);
              const ddz = z - rd(position, k * 3 + 2);
              const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
              if (d2 < best) best = d2;
            }
            const near = Math.exp(-best / (band * band));
            const blinkSeed = latticeHash(level, i, j, 23);
            const blinkRate = latticeHash(level, i, j, 37);
            const blink =
              blinkSeed < 0.07
                ? 0.5 +
                  0.5 *
                    Math.sin(
                      state.clock * (1.4 + blinkRate * 2.2) + blinkRate * 40,
                    )
                : 0;
            const pointerGap =
              (Math.hypot(sx - pointerX, sy - pointerY) * halfHeight) / ratio;
            const key = `${level}:${i}:${j}`;
            if (level <= 2 && engaged > 0.01 && pointerGap < nearestGap) {
              nearestGap = pointerGap;
              nearestKey = key;
            }
            const wanted =
              key === state.markerTarget
                ? engaged * (1 - smoother((pointerGap - 30) / 42))
                : 0;
            const before = previousTargets.get(key) ?? 0;
            const target = before + (wanted - before) * targetEase;
            if (target > 0.002) nextTargets.set(key, target);
            const bracket = Math.max(smoother((blink - 0.55) / 0.4), target);
            const ring = rings.length ? ringBand(sx, sy, level) : 0;
            let reveal = 1;
            if (introOn) {
              const across = clamp((sx / aspect + 1) * 0.5, 0, 1);
              const begin =
                level * 0.22 +
                0.35 +
                across * (INTRO_SECONDS - 1.3 - (LEVELS - 1) * 0.22);
              reveal = smoother((introAge - begin) / 0.5);
            }
            const fade =
              rd(FADE, level) *
              (1 - smoother((markerDepth - 3) / 10) * 0.45) *
              reveal;
            if (fade < 0.002) continue;
            if (markerTotal >= markerCapacity)
              ensureMarkers(markerCapacity * 2);
            const o = markerTotal * MARKER_FLOATS;
            markerData[o] = x;
            markerData[o + 1] = y;
            markerData[o + 2] = z;
            markerData[o + 3] = fade;
            markerData[o + 4] =
              0.42 + 0.5 * near + blink * 0.9 + target * 1.3 + ring * 2.5;
            markerData[o + 5] = bracket;
            markerData[o + 6] = 1 + 0.15 * near + 0.3 * blink + 0.2 * target;
            markerData[o + 7] = 0;
            markerTotal += 1;
            markerCounts[level] = rd(markerCounts, level) + 1;
          }
        }
      }
      state.targets = nextTargets;
      state.markerTarget = nearestKey;
    }
    state.markerTotal = markerTotal;
  };

  const frameUniforms = new Float32Array(36);
  const fullscreen = (
    program: AeroShardsProgram,
    target: AeroShardsTarget | null,
    clear: boolean,
  ) => {
    bindTarget(gl, target, output[0], output[1]);
    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.useProgram(program.program);
  };
  const drawTriangle = () => {
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const bindShardAttributes = (start: number) => {
    gl.bindVertexArray(shardVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, shardBuffer);
    const stride = FLOATS * 4;
    for (let slot = 0; slot < 6; slot += 1) {
      gl.vertexAttribPointer(
        slot,
        4,
        gl.FLOAT,
        false,
        stride,
        start * stride + slot * 16,
      );
    }
  };
  const bindMarkerAttributes = (start: number) => {
    gl.bindVertexArray(markerVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
    const stride = MARKER_FLOATS * 4;
    for (let slot = 0; slot < 2; slot += 1) {
      gl.vertexAttribPointer(
        slot,
        4,
        gl.FLOAT,
        false,
        stride,
        start * stride + slot * 16,
      );
    }
  };
  const setFrame = (program: AeroShardsProgram) => {
    gl.uniform4fv(uniformAt(gl, program, 'uFrame'), frameUniforms);
  };
  const premultiplied = () => {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  };

  const render = (s: AeroShardsSettings, dt: number, reduced: boolean) => {
    updateCamera(s);
    const shards = state.shards;
    ensureCapacity(shards.length);
    simulate(s, dt, reduced);
    if (state.order.length !== shards.length)
      state.order = shards.map((_, index) => index);
    const order = state.order;
    for (let i = 0; i < shards.length; i += 1) {
      depths[i] = rd(depths, i) + (shards[i]?.level ?? 0) * 100;
    }
    for (let i = 1; i < order.length; i += 1) {
      const value = rd(order, i);
      const key = rd(depths, value);
      let j = i - 1;
      while (j >= 0 && rd(depths, rd(order, j)) < key) {
        order[j + 1] = rd(order, j);
        j -= 1;
      }
      order[j + 1] = value;
    }
    const counts = [0, 0, 0, 0, 0];
    for (let slot = 0; slot < order.length; slot += 1) {
      const source = rd(order, slot);
      const from = source * FLOATS;
      const level = shards[source]?.level ?? 0;
      counts[level] = rd(counts, level) + 1;
      upload.set(staging.subarray(from, from + FLOATS), slot * FLOATS);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, shardBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, upload, 0, shards.length * FLOATS);
    if (state.markerTotal > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        markerData,
        0,
        state.markerTotal * MARKER_FLOATS,
      );
    }
    const starts = [0, 0, 0, 0, 0];
    let running = 0;
    for (let level = LEVELS - 1; level >= 0; level -= 1) {
      starts[level] = running;
      running += rd(counts, level);
    }

    const pixelRatio = output[1] / Math.max(container.clientHeight, 1);
    frameUniforms.set([
      output[0],
      output[1],
      cam.focal,
      state.clock,
      rd(cam.eye, 0),
      rd(cam.eye, 1),
      rd(cam.eye, 2),
      FOCUS,
      rd(cam.forward, 0),
      rd(cam.forward, 1),
      rd(cam.forward, 2),
      s.depthOfField * output[1] * 0.03,
      rd(cam.right, 0),
      rd(cam.right, 1),
      rd(cam.right, 2),
      output[1] * 0.05,
      rd(cam.up, 0),
      rd(cam.up, 1),
      rd(cam.up, 2),
      s.lightMode ? 1 : 0,
      s.shard[0],
      s.shard[1],
      s.shard[2],
      0,
      s.accent[0],
      s.accent[1],
      s.accent[2],
      0,
      s.markers,
      pixelRatio,
      4 * pixelRatio,
      FOCUS,
      s.material,
      0,
      0,
      0,
    ]);
    const blooming = s.glow > 0.001 && !s.lightMode;

    const coc = s.depthOfField * output[1] * 0.012;
    const cap = output[1] * 0.02;
    const plan: AeroShardsLevelPlan[] = DEPTHS.map((depth) => {
      const sigma = Math.min(coc * Math.abs(1 - SHARD_FOCUS / depth), cap);
      const group = sigma >= 2.2 ? groups[1] : groups[0];
      if (!group) throw new Error('AeroShards: missing layer group');
      const soft = sigma >= 0.45;
      if (soft && !group.softReady) {
        group.softReady = true;
        resizeTarget(gl, group.temp, format, groupSize(group.scale));
        resizeTarget(gl, group.blurred, format, groupSize(group.scale));
      }
      const width = group.layer.width;
      const height = group.layer.height;
      const step = Math.max(
        0.6,
        1.4 * (width / Math.max(container.clientWidth, 1)),
      );
      return {
        group,
        soft,
        sigma: sigma * group.scale,
        layerView: [width, height, cam.focal * (width / output[0]), 0],
        shadow: s.material === 0 ? 0 : s.lightMode ? 0.32 : 0.62,
        step,
      };
    });

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    for (let level = LEVELS - 1; level >= 0; level -= 1) {
      const step = plan[level];
      if (!step) continue;
      const { group, soft } = step;
      const count = rd(counts, level);
      if (count > 0) {
        bindTarget(gl, group.layer, output[0], output[1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clearDepth(1);
        gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        bindShardAttributes(rd(starts, level));
        for (const program of [shardSolid, shardEdge]) {
          const edge = program === shardEdge;
          gl.depthMask(!edge);
          if (edge) premultiplied();
          else gl.disable(gl.BLEND);
          gl.useProgram(program.program);
          setFrame(program);
          const view = step.layerView;
          setVec4(gl, program, 'uLayerView', view[0], view[1], view[2], level);
          setVec4(gl, program, 'uLayerLook', s.lightMode ? 0.5 : 0.7, 0, 0, 0);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
        }
        gl.depthMask(true);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        fullscreen(shadowProgram, group.shaded, true);
        setTexture(gl, shadowProgram, 'uSource', 0, group.layer.texture);
        setTexture(gl, shadowProgram, 'uDepth', 1, group.layer.depth);
        setVec4(
          gl,
          shadowProgram,
          'uInfo',
          step.step * 0.55,
          step.step * 0.85,
          step.shadow,
          0,
        );
        setVec4(gl, shadowProgram, 'uMore', 0.00045, 0, 0, 0);
        drawTriangle();

        if (soft) {
          fullscreen(layerBlurProgram, group.temp, true);
          setTexture(gl, layerBlurProgram, 'uSource', 0, group.shaded.texture);
          setVec4(
            gl,
            layerBlurProgram,
            'uTexel',
            1 / group.shaded.width,
            0,
            step.sigma,
            0,
          );
          drawTriangle();
          fullscreen(layerBlurProgram, group.blurred, true);
          setTexture(gl, layerBlurProgram, 'uSource', 0, group.temp.texture);
          setVec4(
            gl,
            layerBlurProgram,
            'uTexel',
            0,
            1 / group.temp.height,
            step.sigma,
            0,
          );
          drawTriangle();
        }
      }

      bindTarget(gl, scene, output[0], output[1]);
      if (level === LEVELS - 1) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      premultiplied();
      const markers = rd(markerCounts, level);
      if (markers > 0) {
        gl.useProgram(markerProgram.program);
        setFrame(markerProgram);
        bindMarkerAttributes(rd(markerStarts, level));
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, markers);
      }
      if (count > 0) {
        gl.useProgram(compositeProgram.program);
        setTexture(
          gl,
          compositeProgram,
          'uSource',
          0,
          soft ? group.blurred.texture : group.shaded.texture,
        );
        setVec4(gl, compositeProgram, 'uInfo', rd(FADE, level), 0, 0, 0);
        drawTriangle();
      }
      gl.disable(gl.BLEND);
    }

    bloomLevels.forEach((bloom, index) => {
      if (!blooming) {
        bindTarget(gl, bloom.main, output[0], output[1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      const source =
        index === 0 ? scene : (bloomLevels[index - 1]?.main ?? scene);
      const down = index === 0 ? prefilterProgram : downsampleProgram;
      fullscreen(down, bloom.main, true);
      setTexture(gl, down, 'uSource', 0, source.texture);
      setVec4(
        gl,
        down,
        'uTexel',
        0.5 / source.width,
        0.5 / source.height,
        0.75,
        0.5,
      );
      drawTriangle();
      fullscreen(blurProgram, bloom.spare, true);
      setTexture(gl, blurProgram, 'uSource', 0, bloom.main.texture);
      setVec4(gl, blurProgram, 'uTexel', 1 / bloom.main.width, 0, 0, 0);
      drawTriangle();
      fullscreen(blurProgram, bloom.main, true);
      setTexture(gl, blurProgram, 'uSource', 0, bloom.spare.texture);
      setVec4(gl, blurProgram, 'uTexel', 0, 1 / bloom.main.height, 0, 0);
      drawTriangle();
    });

    const paper = s.paper ?? [0, 0, 0];
    fullscreen(finishProgram, null, true);
    setTexture(gl, finishProgram, 'uScene', 0, scene.texture);
    bloomLevels.forEach((bloom, index) => {
      setTexture(
        gl,
        finishProgram,
        `uBloom${index}`,
        index + 1,
        bloom.main.texture,
      );
    });
    setVec4(
      gl,
      finishProgram,
      'uInfo',
      s.grain,
      Math.floor(state.clock * 24),
      blooming ? s.glow : 0,
      1.3,
    );
    setVec4(
      gl,
      finishProgram,
      'uPaper',
      paper[0],
      paper[1],
      paper[2],
      s.paper ? 1 : 0,
    );
    setVec4(gl, finishProgram, 'uMode', s.lightMode ? 1 : 0, s.vignette, 0, 0);
    drawTriangle();
    gl.bindVertexArray(null);
  };

  const frame = (now: number) => {
    const s = getSettings();
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0;
    state.last = now;
    const reduced = options.reduced();
    state.clock += dt;
    if (state.introAt < 0) state.introAt = state.clock;
    if (state.shards.length !== s.count) {
      state.shards = createShards(s.count, SEED);
      state.order = [];
    }
    const moving = !s.paused && !reduced;
    if (moving) {
      for (let level = 0; level < LEVELS; level += 1) {
        const length = paths[level]?.length ?? 1;
        state.travel[level] =
          (rd(state.travel, level) + (dt * s.speed * 0.09) / length) % 1;
      }
      state.roll += dt * s.speed * 1.0;
      state.twist += dt * s.speed * 0.08;
      state.drift += dt * s.speed;
    }

    let settling = false;
    const decay = Math.exp(-4 * dt);
    for (let index = 0; index < 4; index += 1) {
      const goal = index === s.placement ? 1 : 0;
      const offset = rd(state.weights, index) - goal;
      const momentum = rd(state.weightVelocity, index) + 4 * offset;
      state.weights[index] = goal + (offset + momentum * dt) * decay;
      state.weightVelocity[index] =
        (rd(state.weightVelocity, index) - 4 * momentum * dt) * decay;
      if (Math.abs(rd(state.weights, index) - goal) > 0.0005) settling = true;
    }
    if (!settling) {
      state.weights = [0, 1, 2, 3].map((index) =>
        index === s.placement ? 1 : 0,
      );
      state.weightVelocity = [0, 0, 0, 0];
    }

    const engaged = s.mouseInteraction && state.inside && !reduced;
    state.presence +=
      ((engaged ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.25));
    const lean = engaged ? s.parallax : 0;
    const targetYaw = (state.pointer[0] - 0.5) * lean * 0.14;
    const targetPitch = (state.pointer[1] - 0.5) * lean * 0.08;
    state.yawVelocity +=
      (38 * (targetYaw - state.yaw) - 11 * state.yawVelocity) * dt;
    state.pitchVelocity +=
      (38 * (targetPitch - state.pitch) - 11 * state.pitchVelocity) * dt;
    state.yaw += state.yawVelocity * dt;
    state.pitch += state.pitchVelocity * dt;
    const leaning =
      Math.abs(targetYaw - state.yaw) + Math.abs(targetPitch - state.pitch) >
        1e-4 ||
      Math.abs(state.yawVelocity) + Math.abs(state.pitchVelocity) > 1e-4;

    const pressPoint = state.pressPoint;
    if (
      state.pressAt >= 0 &&
      pressPoint &&
      s.holdToGather &&
      !reduced &&
      state.clock - state.pressAt > 0.18
    ) {
      if (!state.holding) {
        state.holding = true;
        updateCamera(s);
        rayAt(pressPoint[0], pressPoint[1]);
        const r0 = rd(ray, 0);
        const r1 = rd(ray, 1);
        const r2 = rd(ray, 2);
        const travelTo =
          FOCUS /
          Math.max(
            r0 * rd(cam.forward, 0) +
              r1 * rd(cam.forward, 1) +
              r2 * rd(cam.forward, 2),
            0.2,
          );
        state.gatherCenter = [
          rd(cam.eye, 0) + r0 * travelTo,
          rd(cam.eye, 1) + r1 * travelTo,
          rd(cam.eye, 2) + r2 * travelTo,
        ];
        state.reach = 0;
      }
      state.hold = Math.min(1, state.hold + dt / 0.5);
      state.reach = Math.min(state.reach + dt * 0.5, 0.55);
      const reach = (0.22 + state.reach) / s.scale;
      for (const shard of state.shards) {
        if (shard.joined || shard.level > 2) continue;
        const gx = shard.position[0] - state.gatherCenter[0];
        const gy = shard.position[1] - state.gatherCenter[1];
        if (gx * gx + gy * gy < reach * reach) shard.joined = true;
      }
    } else if (state.hold > 0) {
      state.hold = Math.max(0, state.hold - dt / 0.3);
      if (state.hold === 0) {
        for (const shard of state.shards) shard.joined = false;
      }
    }

    for (const ring of state.rings) ring.age += dt;
    state.rings = state.rings.filter((ring) => ring.age < RING_SECONDS);
    if (moving) state.markerDrift += dt * s.speed * 0.045;

    const flashing = state.shards.some(
      (shard: ShardInstance) =>
        shard.flash > 0.01 ||
        Math.abs(shard.tiltVelocity) > 0.01 ||
        Math.abs(shard.tilt) > 0.01,
    );
    const transient =
      settling ||
      leaning ||
      flashing ||
      state.presence > 0.002 ||
      state.rings.length > 0 ||
      state.hold > 0 ||
      (s.intro &&
        !reduced &&
        state.clock - state.introAt < INTRO_SECONDS + 0.5);
    if (state.seen !== s || transient || moving || state.dirtySize)
      state.quiet = 0;
    else state.quiet += 1;
    state.seen = s;
    state.dirtySize = false;
    if (state.quiet > 30) return false;
    resize();
    render(s, dt, reduced);
    return true;
  };

  return {
    frame,
    invalidate() {
      state.dirtySize = true;
      state.quiet = 0;
    },
    move(spot: AeroShardsSpot) {
      state.inside = spot.inside;
      if (spot.inside) state.pointer = [spot.u, spot.v];
    },
    press(spot: AeroShardsSpot) {
      if (!spot.inside) return;
      state.pointer = [spot.u, spot.v];
      state.pressAt = state.clock;
      state.pressPoint = [spot.u, spot.v];
      state.quiet = 0;
    },
    release() {
      const s = getSettings();
      if (state.pressAt < 0) return;
      const pressPoint = state.pressPoint;
      if (!state.holding && s.pulseOnClick && pressPoint) {
        const aspect = output[0] / Math.max(output[1], 1);
        state.rings.push({
          x: (pressPoint[0] * 2 - 1) * aspect,
          y: 1 - pressPoint[1] * 2,
          age: 0,
        });
        if (state.rings.length > MAX_RINGS) state.rings.shift();
      }
      if (state.holding) {
        for (const shard of state.shards) {
          if (shard.joined) shard.tiltVelocity += 9 * shard.sign;
        }
      }
      state.pressAt = -1;
      state.holding = false;
      state.quiet = 0;
    },
    leave() {
      state.inside = false;
    },
    resetClock() {
      state.last = 0;
    },
    destroy() {
      for (const target of allTargets()) deleteTarget(gl, target);
      for (const program of programs) gl.deleteProgram(program.program);
      gl.deleteBuffer(shardBuffer);
      gl.deleteBuffer(markerBuffer);
      gl.deleteVertexArray(emptyVao);
      gl.deleteVertexArray(shardVao);
      gl.deleteVertexArray(markerVao);
    },
  };
}
