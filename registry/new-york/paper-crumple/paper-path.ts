import type { PaperPath, PaperSpring } from './types';

export function spring(value = 0): PaperSpring {
  return { value, target: value, velocity: 0 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Critically damped spring step. Returns true while still moving. */
export function advance(
  s: PaperSpring,
  dt: number,
  duration: number,
  instant: boolean,
): boolean {
  if (instant || duration <= 0) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  const omega = 8 / Math.max(0.06, duration);
  const offset = s.value - s.target;
  const term = s.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  s.value = s.target + (offset + term * dt) * decay;
  s.velocity = (s.velocity - omega * term * dt) * decay;
  if (Math.abs(s.value - s.target) < 0.0001 && Math.abs(s.velocity) < 0.001) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  return true;
}

/** mulberry32 PRNG. */
export function randomSource(seed: number): () => number {
  let value = seed | 0;
  return () => {
    value |= 0;
    value = (value + 1831565813) | 0;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Runs the cloth-style crumple solver once and records 64 frames of vertex
 * positions plus the "creased" pose left after unfolding.
 */
export function createPaperPath(
  rest: Float32Array,
  triangles: number[],
  shortSide: number,
  density: number,
  sharpness: number,
  depth: number,
  seed: number,
): PaperPath {
  const count = rest.length / 3;
  const points = Float64Array.from(rest);
  const previous = Float64Array.from(rest);
  const before = Float64Array.from(rest);
  const edges: number[] = [];
  const hinges: number[] = [];
  const adjacency = new Map<
    number,
    { a: number; b: number; opposite: number }
  >();
  const random = randomSource(seed);
  const guides = Array.from({ length: density }, () => {
    const angle = random() * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: Math.sin(angle),
      phase: random() * Math.PI * 2,
      weight: random() * 0.6 + 0.4,
    };
  });
  const r = (i: number) => rest[i] ?? 0;
  const p = (i: number) => points[i] ?? 0;
  const tri = (i: number) => triangles[i] ?? 0;

  for (let t = 0; t < triangles.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = tri(t + k);
      const b = tri(t + ((k + 1) % 3));
      const opposite = tri(t + ((k + 2) % 3));
      const key = Math.min(a, b) * count + Math.max(a, b);
      const other = adjacency.get(key);
      if (!other) {
        adjacency.set(key, { a, b, opposite });
        const length = Math.hypot(
          r(a * 3) - r(b * 3),
          r(a * 3 + 1) - r(b * 3 + 1),
        );
        edges.push(a * 3, b * 3, length);
      } else {
        const c = other.opposite * 3;
        const d = opposite * 3;
        const length = Math.hypot(r(c) - r(d), r(c + 1) - r(d + 1));
        const mx = (r(c) + r(d)) * 0.5;
        const my = (r(c + 1) + r(d + 1)) * 0.5;
        let weakness = 0;
        for (const guide of guides) {
          const distance = Math.abs(
            Math.sin(
              ((mx * guide.x + my * guide.y) / shortSide) * 4 + guide.phase,
            ),
          );
          weakness = Math.max(
            weakness,
            Math.exp(-distance * distance * 80) * guide.weight,
          );
        }
        hinges.push(c, d, length, 0.12 + (1 - weakness) * 0.75);
      }
    }
  }
  const spacing = Math.sqrt((shortSide * shortSide) / count);
  const thickness = shortSide * 0.008;
  const samples: Float32Array[] = [rest.slice()];
  const frameCount = 64;
  const stepsPerFrame = 3;
  const totalSteps = frameCount * stepsPerFrame;
  let initialRadius = 0;
  for (let i = 0; i < rest.length; i += 3) {
    initialRadius = Math.max(
      initialRadius,
      Math.hypot(r(i) / 0.94, r(i + 1) / 1.02),
    );
  }
  initialRadius *= 1.02;

  function constrain(
    list: number[],
    stride: number,
    stiffness: number,
    reverse: boolean,
  ) {
    for (let n = 0; n < list.length; n += stride) {
      const edge = reverse ? list.length - stride - n : n;
      const a = list[edge] ?? 0;
      const b = list[edge + 1] ?? 0;
      const dx = p(b) - p(a);
      const dy = p(b + 1) - p(a + 1);
      const dz = p(b + 2) - p(a + 2);
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < 0.000001) continue;
      const weight = stride === 4 ? (list[edge + 3] ?? 1) : 1;
      const amount =
        (1 - (list[edge + 2] ?? 0) / length) * 0.5 * stiffness * weight;
      points[a] = p(a) + dx * amount;
      points[b] = p(b) - dx * amount;
      points[a + 1] = p(a + 1) + dy * amount;
      points[b + 1] = p(b + 1) - dy * amount;
      points[a + 2] = p(a + 2) + dz * amount;
      points[b + 2] = p(b + 2) - dz * amount;
    }
  }

  function separateLayers() {
    const margin = thickness * 2;
    for (let t = 0; t < triangles.length; t += 3) {
      const a = tri(t) * 3;
      const b = tri(t + 1) * 3;
      const c = tri(t + 2) * 3;
      const ax = p(a);
      const ay = p(a + 1);
      const az = p(a + 2);
      const bx = p(b) - ax;
      const by = p(b + 1) - ay;
      const bz = p(b + 2) - az;
      const cx = p(c) - ax;
      const cy = p(c + 1) - ay;
      const cz = p(c + 2) - az;
      let nx = by * cz - bz * cy;
      let ny = bz * cx - bx * cz;
      let nz = bx * cy - by * cx;
      const length = Math.hypot(nx, ny, nz);
      if (length < 0.0000001) continue;
      nx /= length;
      ny /= length;
      nz /= length;
      const minX = Math.min(ax, p(b), p(c)) - margin;
      const maxX = Math.max(ax, p(b), p(c)) + margin;
      const minY = Math.min(ay, p(b + 1), p(c + 1)) - margin;
      const maxY = Math.max(ay, p(b + 1), p(c + 1)) + margin;
      const minZ = Math.min(az, p(b + 2), p(c + 2)) - margin;
      const maxZ = Math.max(az, p(b + 2), p(c + 2)) + margin;
      const bb = bx * bx + by * by + bz * bz;
      const cc = cx * cx + cy * cy + cz * cz;
      const bc = bx * cx + by * cy + bz * cz;
      const determinant = bb * cc - bc * bc;
      if (determinant < 0.0000000001) continue;
      const restCx = (r(a) + r(b) + r(c)) / 3;
      const restCy = (r(a + 1) + r(b + 1) + r(c + 1)) / 3;
      for (let q = 0; q < points.length; q += 3) {
        if (q === a || q === b || q === c) continue;
        const qx = p(q);
        const qy = p(q + 1);
        const qz = p(q + 2);
        if (
          qx < minX ||
          qx > maxX ||
          qy < minY ||
          qy > maxY ||
          qz < minZ ||
          qz > maxZ
        )
          continue;
        const rx = r(q) - restCx;
        const ry = r(q + 1) - restCy;
        if (rx * rx + ry * ry < spacing * spacing * 6) continue;
        const dx = qx - ax;
        const dy = qy - ay;
        const dz = qz - az;
        const distance = dx * nx + dy * ny + dz * nz;
        const bA = (i: number) => before[i] ?? 0;
        const previousDistance =
          (bA(q) - bA(a)) * nx +
          (bA(q + 1) - bA(a + 1)) * ny +
          (bA(q + 2) - bA(a + 2)) * nz;
        const side = previousDistance >= 0 ? 1 : -1;
        if (distance * side >= thickness || Math.abs(distance) > margin)
          continue;
        const pb = dx * bx + dy * by + dz * bz;
        const pc = dx * cx + dy * cy + dz * cz;
        const u = (cc * pb - bc * pc) / determinant;
        const v = (bb * pc - bc * pb) / determinant;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const w = 1 - u - v;
        const correction =
          (thickness * side - distance) / (1 + w * w + u * u + v * v);
        for (let axis = 0; axis < 3; axis++) {
          const normal = axis === 0 ? nx : axis === 1 ? ny : nz;
          const movement = normal * correction;
          points[q + axis] = p(q + axis) + movement;
          points[a + axis] = p(a + axis) - movement * w;
          points[b + axis] = p(b + axis) - movement * u;
          points[c + axis] = p(c + axis) - movement * v;
        }
      }
    }
  }

  for (let step = 1; step <= totalSteps; step++) {
    const progress = step / totalSteps;
    const compression = progress * progress * (3 - 2 * progress);
    const radius =
      initialRadius * (1 - compression) +
      shortSide * (0.19 - depth * 0.025) * compression;
    before.set(points);
    for (let i = 0; i < points.length; i += 3) {
      const x = r(i) / shortSide;
      const y = r(i + 1) / shortSide;
      let buckle = 0;
      for (const guide of guides) {
        buckle +=
          Math.sin((x * guide.x + y * guide.y) * 5 + guide.phase) *
          guide.weight;
      }
      for (let axis = 0; axis < 3; axis++) {
        const velocity = (p(i + axis) - (previous[i + axis] ?? 0)) * 0.55;
        previous[i + axis] = p(i + axis);
        points[i + axis] =
          p(i + axis) + clamp(velocity, -spacing * 0.15, spacing * 0.15);
      }
      points[i + 2] =
        p(i + 2) +
        (buckle / density) * shortSide * 0.0007 * Math.sin(progress * Math.PI);
    }
    for (let pass = 0; pass < 18; pass++) {
      constrain(hinges, 4, 0.45 * (1 - sharpness * 0.4), pass % 2 === 0);
      for (let i = 0; i < points.length; i += 3) {
        const x = p(i) / 0.94;
        const y = p(i + 1) / 1.02;
        const z = p(i + 2) / 0.86;
        const distance = Math.hypot(x, y, z);
        if (distance > radius) {
          const push = (1 - radius / distance) * 0.55;
          points[i] = p(i) - p(i) * push;
          points[i + 1] = p(i + 1) - p(i + 1) * push;
          points[i + 2] = p(i + 2) - p(i + 2) * push;
        }
      }
      constrain(edges, 3, 1, pass % 2 !== 0);
      if (pass === 8 || pass === 17) separateLayers();
    }
    for (let h = 0; h < hinges.length; h += 4) {
      const a = hinges[h] ?? 0;
      const b = hinges[h + 1] ?? 0;
      const rest2 = hinges[h + 2] ?? 0;
      const length = Math.hypot(
        p(a) - p(b),
        p(a + 1) - p(b + 1),
        p(a + 2) - p(b + 2),
      );
      if (length < rest2 * 0.86)
        hinges[h + 2] = rest2 + (length - rest2) * 0.12;
    }
    if (step % stepsPerFrame === 0) samples.push(Float32Array.from(points));
  }
  const folded = Float64Array.from(points);
  for (let step = 1; step <= 80; step++) {
    const t = step / 80;
    const unfold = t * t * (3 - 2 * t);
    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < points.length; i++) {
        const f = folded[i] ?? 0;
        const target = f + (r(i) - f) * unfold;
        points[i] = p(i) + (target - p(i)) * (i % 3 === 2 ? 0.04 : 0.22);
      }
      constrain(hinges, 4, 0.7, pass % 2 === 0);
      constrain(edges, 3, 1, pass % 2 !== 0);
    }
  }
  return { samples, creased: Float32Array.from(points) };
}
