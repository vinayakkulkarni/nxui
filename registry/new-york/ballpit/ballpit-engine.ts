import {
  CAMERA_Z,
  FOV,
  MATERIALS,
  MAX_ASPECT,
  MAX_SPEED,
  SLOP,
  STRIDE,
  clamp,
  linkBallpitProgram,
  toLinear,
} from './ballpit-gl';
import type { BallpitEngine, BallpitSettings } from './types';

type Vec3 = [number, number, number];

const FALLBACK_COLOR: Vec3 = [1, 1, 1];

/**
 * Instanced ray-traced spheres on WebGL2 with a sequential-impulse solver on a
 * uniform 3D grid. The loop sleeps once everything has settled and wakes on
 * input, prop changes or visibility.
 */
export function createBallpitEngine(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  read: () => BallpitSettings,
): BallpitEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;
  const shader = linkBallpitProgram(gl);
  if (!shader) return null;
  const u = shader.uniforms;

  const view = {
    width: 1,
    height: 1,
    ratio: 1,
    halfW: 9,
    halfH: 9,
    fit: 1,
    tan: Math.tan((FOV * Math.PI) / 360),
  };
  const projection = new Float32Array(16);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const instances = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instances);
  for (let k = 0; k < 3; k++) {
    gl.enableVertexAttribArray(1 + k);
    gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, STRIDE * 4, k * 16);
    gl.vertexAttribDivisor(1 + k, 1);
  }
  gl.bindVertexArray(null);

  let capacity = 0;
  let n = 0;
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let pz = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let vz = new Float32Array(0);
  let rad = new Float32Array(0);
  let inv = new Float32Array(0);
  let size = new Float32Array(0);
  let phase = new Float32Array(0);
  let occ = new Float32Array(0);
  let still = new Float32Array(0);
  let tone = new Uint16Array(0);
  let entered = new Uint8Array(0);
  let cellOf = new Int32Array(0);
  let sorted = new Int32Array(0);
  let order = new Int32Array(1);
  let data = new Float32Array(STRIDE);
  let table = new Int32Array(2);
  let starts = new Int32Array(2);
  let palette: Vec3[] = [];
  let paletteKey = '';
  let lastSizes = '';

  const grow = (old: Float32Array, total: number, width = 1) => {
    const next = new Float32Array(total * width);
    next.set(old.subarray(0, Math.min(old.length, next.length)));
    return next;
  };

  const allocate = (total: number) => {
    px = grow(px, total);
    py = grow(py, total);
    pz = grow(pz, total);
    vx = grow(vx, total);
    vy = grow(vy, total);
    vz = grow(vz, total);
    rad = grow(rad, total);
    inv = grow(inv, total);
    size = grow(size, total);
    phase = grow(phase, total);
    occ = grow(occ, total, 4);
    still = grow(still, total, 3);
    const nextTone = new Uint16Array(total);
    nextTone.set(tone.subarray(0, Math.min(tone.length, total)));
    tone = nextTone;
    const nextEntered = new Uint8Array(total);
    nextEntered.set(entered.subarray(0, Math.min(entered.length, total)));
    entered = nextEntered;
    cellOf = new Int32Array(total);
    sorted = new Int32Array(total);
    order = new Int32Array(total + 1);
    data = new Float32Array((total + 1) * STRIDE);
    capacity = total;
    gl.bindBuffer(gl.ARRAY_BUFFER, instances);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  };

  const pointer = {
    inside: false,
    down: false,
    downX: 0,
    downY: 0,
    downAt: 0,
    moved: false,
  };
  const cursor = { x: 0, y: 0, z: 0, r: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  const light = { x: 0, y: 5, z: 6, flash: 0 };
  const held = { index: -1, ox: 0, oy: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
  let elapsed = 0;
  let glide = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let quiet = 0;

  const spawn = (i: number, s: BallpitSettings, fromTop: boolean) => {
    const r = rad[i]!;
    const zr = Math.max(s.depth - r, 0);
    entered[i] = 1;
    if (fromTop && s.gravity > 0.05) {
      px[i] = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
      py[i] = view.halfH + r + Math.random() * view.halfH * 2.2;
      pz[i] = (Math.random() * 2 - 1) * zr;
      vx[i] = (Math.random() - 0.5) * 2;
      vy[i] = -(4 + Math.random() * 5);
      vz[i] = 0;
      entered[i] = 0;
    } else if (fromTop) {
      const tx = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
      const ty = (Math.random() * 2 - 1) * Math.max(view.halfH - r, 0.01);
      const tz = (Math.random() * 2 - 1) * zr;
      px[i] = (Math.random() * 2 - 1) * 0.6;
      py[i] = (Math.random() * 2 - 1) * 0.6;
      pz[i] = (Math.random() * 2 - 1) * Math.min(zr, 0.3);
      vx[i] = (tx - px[i]!) * 2.2;
      vy[i] = (ty - py[i]!) * 2.2;
      vz[i] = (tz - pz[i]!) * 2.2;
      glide = 1;
    } else {
      px[i] = (Math.random() * 2 - 1) * Math.max(view.halfW - r, 0.01);
      py[i] = (Math.random() * 2 - 1) * Math.max(view.halfH - r, 0.01);
      pz[i] = (Math.random() * 2 - 1) * zr;
      vx[i] = 0;
      vy[i] = 0;
      vz[i] = 0;
    }
  };

  const setRadius = (i: number, s: BallpitSettings) => {
    const r = (s.minSize + size[i]! * (s.maxSize - s.minSize)) * view.fit;
    rad[i] = r;
    inv[i] = 1 / (r * r * r);
  };

  const sync = (s: BallpitSettings, first: boolean) => {
    const key = `${s.minSize}:${s.maxSize}:${view.fit}`;
    if (s.count !== n) {
      if (s.count > capacity)
        allocate(Math.max(s.count, Math.ceil(capacity * 1.5)));
      const from = n;
      n = s.count;
      for (let i = from; i < n; i++) {
        size[i] = Math.random();
        tone[i] = i;
        phase[i] = Math.random() * Math.PI * 2;
        setRadius(i, s);
        spawn(i, s, (first ? s.intro : true) && !s.reduce);
      }
      for (let i = 0; i <= n; i++) order[i] = i;
    }
    if (key !== lastSizes) {
      lastSizes = key;
      for (let i = 0; i < n; i++) setRadius(i, s);
    }
    const colorKey = s.colors.join('|');
    if (colorKey !== paletteKey) {
      palette = s.colors.map(toLinear);
      paletteKey = colorKey;
    }
  };

  let contacts = new Float32Array(0);
  let contactCount = 0;

  const grid = { scale: 1, x0: 0, y0: 0, z0: 0, nx: 1, ny: 1, nz: 1 };

  const buildGrid = (cell: number, s: BallpitSettings) => {
    const reachZ = Math.max(s.depth, s.maxSize);
    grid.scale = 1 / cell;
    grid.x0 = -view.halfW - cell;
    grid.y0 = -view.halfH - cell;
    grid.z0 = -reachZ - cell;
    grid.nx = Math.max(
      1,
      Math.ceil((view.halfW * 2 + cell * 2) * grid.scale) + 1,
    );
    grid.ny = Math.max(
      1,
      Math.ceil((view.halfH * 2 + cell * 2) * grid.scale) + 1,
    );
    grid.nz = Math.max(1, Math.ceil((reachZ * 2 + cell * 2) * grid.scale) + 1);
    const cells = grid.nx * grid.ny * grid.nz;
    if (table.length < cells + 1) {
      table = new Int32Array(cells + 1);
      starts = new Int32Array(cells + 1);
    }
    table.fill(0, 0, cells + 1);
    for (let i = 0; i < n; i++) {
      const cx = clamp(
        Math.floor((px[i]! - grid.x0) * grid.scale),
        0,
        grid.nx - 1,
      );
      const cy = clamp(
        Math.floor((py[i]! - grid.y0) * grid.scale),
        0,
        grid.ny - 1,
      );
      const cz = clamp(
        Math.floor((pz[i]! - grid.z0) * grid.scale),
        0,
        grid.nz - 1,
      );
      const c = (cz * grid.ny + cy) * grid.nx + cx;
      cellOf[i] = c;
      table[c + 1]!++;
    }
    for (let c = 1; c <= cells; c++) table[c]! += table[c - 1]!;
    starts.set(table.subarray(0, cells + 1));
    for (let i = 0; i < n; i++) sorted[starts[cellOf[i]!]!++] = i;
  };

  const pushContact = (
    i: number,
    j: number,
    nx: number,
    ny: number,
    nz: number,
    gap: number,
    restitution: number,
  ) => {
    const o = contactCount * 8;
    contacts[o] = i;
    contacts[o + 1] = j;
    contacts[o + 2] = nx;
    contacts[o + 3] = ny;
    contacts[o + 4] = nz;
    contacts[o + 5] = gap;
    contacts[o + 6] = restitution;
    contacts[o + 7] = 0;
    contactCount++;
  };

  const wall = (
    i: number,
    gap: number,
    nx: number,
    ny: number,
    nz: number,
    bounce: number,
    margin: number,
  ) => {
    if (gap >= margin || contactCount * 8 >= contacts.length) return;
    const approach = vx[i]! * nx + vy[i]! * ny + vz[i]! * nz;
    pushContact(
      i,
      -2,
      nx,
      ny,
      nz,
      gap,
      approach < -1.5 ? -bounce * approach : 0,
    );
  };

  const findContacts = (s: BallpitSettings, shade: boolean, margin: number) => {
    const heldIndex = held.index;
    const gx = grid.nx;
    const gy = grid.ny;
    const gz = grid.nz;
    contactCount = 0;
    for (let i = 0; i < n; i++) {
      const c = cellOf[i]!;
      const cx = c % gx;
      const cy = Math.floor(c / gx) % gy;
      const cz = Math.floor(c / (gx * gy));
      for (let dz = cz > 0 ? -1 : 0; dz <= (cz < gz - 1 ? 1 : 0); dz++) {
        for (let dy = cy > 0 ? -1 : 0; dy <= (cy < gy - 1 ? 1 : 0); dy++) {
          const row = ((cz + dz) * gy + cy + dy) * gx;
          for (let dx = cx > 0 ? -1 : 0; dx <= (cx < gx - 1 ? 1 : 0); dx++) {
            const cell = row + cx + dx;
            for (let k = table[cell]!; k < table[cell + 1]!; k++) {
              const j = sorted[k]!;
              if (j <= i) continue;
              const ddx = px[j]! - px[i]!;
              const ddy = py[j]! - py[i]!;
              const ddz = pz[j]! - pz[i]!;
              const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
              const sum = rad[i]! + rad[j]!;
              const reach = Math.max(sum + margin, shade ? sum * 1.4 : 0);
              if (d2 >= reach * reach || d2 < 1e-12) continue;
              const d = Math.sqrt(d2);
              const nx = ddx / d;
              const ny = ddy / d;
              const nz = ddz / d;
              if (shade) {
                const w = clamp(1 - (d - sum) / (sum * 0.4), 0, 1);
                occ[i * 4]! += nx * w;
                occ[i * 4 + 1]! += ny * w;
                occ[i * 4 + 2]! += nz * w;
                occ[i * 4 + 3]! += w;
                occ[j * 4]! -= nx * w;
                occ[j * 4 + 1]! -= ny * w;
                occ[j * 4 + 2]! -= nz * w;
                occ[j * 4 + 3]! += w;
              }
              if (d >= sum + margin || contactCount * 8 >= contacts.length)
                continue;
              if (i === heldIndex && j === heldIndex) continue;
              const approach =
                (vx[j]! - vx[i]!) * nx +
                (vy[j]! - vy[i]!) * ny +
                (vz[j]! - vz[i]!) * nz;
              pushContact(
                i,
                j,
                nx,
                ny,
                nz,
                d - sum,
                approach < -1.5 ? -s.bounce * approach : 0,
              );
            }
          }
        }
      }
      if (i !== heldIndex) {
        const r = rad[i]!;
        const zr = Math.max(s.depth - r, 0);
        const e = s.wallBounce;
        wall(i, px[i]! + view.halfW - r, 1, 0, 0, e, margin);
        wall(i, view.halfW - r - px[i]!, -1, 0, 0, e, margin);
        wall(i, py[i]! + view.halfH - r, 0, 1, 0, e, margin);
        if (entered[i]) wall(i, view.halfH - r - py[i]!, 0, -1, 0, e, margin);
        wall(i, pz[i]! + zr, 0, 0, 1, e, margin);
        wall(i, zr - pz[i]!, 0, 0, -1, e, margin);
      }
      if (
        cursor.r > 0.01 &&
        i !== heldIndex &&
        contactCount * 8 < contacts.length
      ) {
        const ddx = px[i]! - cursor.x;
        const ddy = py[i]! - cursor.y;
        const ddz = pz[i]! - cursor.z;
        const sum = rad[i]! + cursor.r;
        const d2 = ddx * ddx + ddy * ddy + ddz * ddz;
        if (d2 < (sum + margin) * (sum + margin) && d2 > 1e-12) {
          const d = Math.sqrt(d2);
          const nx = ddx / d;
          const ny = ddy / d;
          const nz = ddz / d;
          const approach =
            (vx[i]! - cursor.vx) * nx + (vy[i]! - cursor.vy) * ny + vz[i]! * nz;
          pushContact(
            i,
            -1,
            nx,
            ny,
            nz,
            d - sum,
            approach < -1.5 ? -s.bounce * approach : 0,
          );
        }
      }
    }
  };

  const solveVelocities = (dt: number) => {
    const heldIndex = held.index;
    const iterations = n > 800 ? 5 : 8;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let c = 0; c < contactCount; c++) {
        const o = c * 8;
        const i = contacts[o]!;
        const j = contacts[o + 1]!;
        const nx = contacts[o + 2]!;
        const ny = contacts[o + 3]!;
        const nz = contacts[o + 4]!;
        const gap = contacts[o + 5]!;
        const target = gap > 0 ? -gap / dt : contacts[o + 6]!;
        const before = contacts[o + 7]!;
        if (j < 0) {
          const vn =
            j === -1
              ? (vx[i]! - cursor.vx) * nx +
                (vy[i]! - cursor.vy) * ny +
                vz[i]! * nz
              : vx[i]! * nx + vy[i]! * ny + vz[i]! * nz;
          const after = Math.max(before + target - vn, 0);
          const change = after - before;
          contacts[o + 7] = after;
          vx[i]! += change * nx;
          vy[i]! += change * ny;
          vz[i]! += change * nz;
          continue;
        }
        const wi = i === heldIndex ? 0 : inv[i]!;
        const wj = j === heldIndex ? 0 : inv[j]!;
        const w = wi + wj;
        if (w <= 0) continue;
        const vn =
          (vx[j]! - vx[i]!) * nx +
          (vy[j]! - vy[i]!) * ny +
          (vz[j]! - vz[i]!) * nz;
        const after = Math.max(before + (target - vn) / w, 0);
        const change = after - before;
        contacts[o + 7] = after;
        vx[i]! -= change * wi * nx;
        vy[i]! -= change * wi * ny;
        vz[i]! -= change * wi * nz;
        vx[j]! += change * wj * nx;
        vy[j]! += change * wj * ny;
        vz[j]! += change * wj * nz;
      }
    }
  };

  const correctPositions = () => {
    const heldIndex = held.index;
    for (let pass = 0; pass < 2; pass++) {
      for (let c = 0; c < contactCount; c++) {
        const o = c * 8;
        const i = contacts[o]!;
        const j = contacts[o + 1]!;
        if (j === -2) continue;
        if (j < 0) {
          const ddx = px[i]! - cursor.x;
          const ddy = py[i]! - cursor.y;
          const ddz = pz[i]! - cursor.z;
          const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
          const overlap = rad[i]! + cursor.r - d - SLOP;
          if (overlap <= 0 || d < 1e-6) continue;
          const k = (overlap * 0.5) / d;
          px[i]! += ddx * k;
          py[i]! += ddy * k;
          pz[i]! += ddz * k;
          continue;
        }
        const ddx = px[j]! - px[i]!;
        const ddy = py[j]! - py[i]!;
        const ddz = pz[j]! - pz[i]!;
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
        const overlap = rad[i]! + rad[j]! - d - SLOP;
        if (overlap <= 0 || d < 1e-6) continue;
        const wi = i === heldIndex ? 0 : inv[i]!;
        const wj = j === heldIndex ? 0 : inv[j]!;
        const w = wi + wj;
        if (w <= 0) continue;
        const k = (overlap * 0.3) / (d * w);
        px[i]! -= ddx * k * wi;
        py[i]! -= ddy * k * wi;
        pz[i]! -= ddz * k * wi;
        px[j]! += ddx * k * wj;
        py[j]! += ddy * k * wj;
        pz[j]! += ddz * k * wj;
      }
    }
  };

  const walls = (s: BallpitSettings) => {
    const hw = view.halfW;
    const hh = view.halfH;
    const e = s.wallBounce;
    for (let i = 0; i < n; i++) {
      const r = rad[i]!;
      if (px[i]! < -hw + r) {
        px[i] = -hw + r;
        if (vx[i]! < 0) vx[i] = vx[i]! < -1.5 ? -vx[i]! * e : 0;
      } else if (px[i]! > hw - r) {
        px[i] = hw - r;
        if (vx[i]! > 0) vx[i] = vx[i]! > 1.5 ? -vx[i]! * e : 0;
      }
      if (py[i]! < -hh + r) {
        py[i] = -hh + r;
        if (vy[i]! < 0) vy[i] = vy[i]! < -1.5 ? -vy[i]! * e : 0;
        vx[i]! *= 0.995;
        vz[i]! *= 0.995;
      } else if (entered[i] && py[i]! > hh - r) {
        py[i] = hh - r;
        if (vy[i]! > 0) vy[i] = vy[i]! > 1.5 ? -vy[i]! * e : 0;
      }
      if (!entered[i] && py[i]! < hh - r) entered[i] = 1;
      const zr = Math.max(s.depth - r, 0);
      if (pz[i]! < -zr) {
        pz[i] = -zr;
        if (vz[i]! < 0) vz[i] = vz[i]! < -1.5 ? -vz[i]! * e : 0;
      } else if (pz[i]! > zr) {
        pz[i] = zr;
        if (vz[i]! > 0) vz[i] = vz[i]! > 1.5 ? -vz[i]! * e : 0;
      }
    }
  };

  const step = (s: BallpitSettings, dt: number, shade: boolean) => {
    const g = s.gravity * 45;
    const damp =
      s.friction ** (dt * 60) * (glide > 0 ? Math.exp(-2.2 * dt) : 1);
    const wander = s.reduce ? 0 : s.drift * 2.2;
    const biggest = s.maxSize * view.fit;
    const margin = biggest * 0.3;
    if (contacts.length < n * 96) contacts = new Float32Array(n * 96);
    for (let i = 0; i < n; i++) {
      if (i === held.index) {
        const f = 1 - Math.exp(-dt / 0.02);
        vx[i] = ((held.tx - px[i]!) * f) / dt;
        vy[i] = ((held.ty - py[i]!) * f) / dt;
        vz[i] = 0;
        continue;
      }
      vy[i]! -= g * dt;
      if (wander) {
        const p = phase[i]!;
        vx[i]! += Math.sin(elapsed * 0.63 + p) * wander * dt;
        vy[i]! += Math.cos(elapsed * 0.47 + p * 1.7) * wander * dt;
        vz[i]! += Math.sin(elapsed * 0.41 + p * 2.3) * wander * dt * 0.5;
      }
      vx[i]! *= damp;
      vy[i]! *= damp;
      vz[i]! *= damp;
      const sp = vx[i]! * vx[i]! + vy[i]! * vy[i]! + vz[i]! * vz[i]!;
      if (sp > MAX_SPEED * MAX_SPEED) {
        const f = MAX_SPEED / Math.sqrt(sp);
        vx[i]! *= f;
        vy[i]! *= f;
        vz[i]! *= f;
      }
    }
    buildGrid(biggest * (shade ? 2.8 : 2.3), s);
    if (shade) occ.fill(0, 0, n * 4);
    findContacts(s, shade, margin);
    solveVelocities(dt);
    for (let i = 0; i < n; i++) {
      px[i]! += vx[i]! * dt;
      py[i]! += vy[i]! * dt;
      pz[i]! += vz[i]! * dt;
    }
    correctPositions();
    walls(s);
    if (shade) {
      for (let i = 0; i < n; i++) {
        const gap = py[i]! - rad[i]! + view.halfH;
        const reach = rad[i]! * 0.5;
        if (gap >= reach) continue;
        const w = 1 - Math.max(gap, 0) / reach;
        occ[i * 4 + 1]! -= w;
        occ[i * 4 + 3]! += w;
      }
    }
    if (held.index >= 0) {
      const i = held.index;
      held.vx += (vx[i]! - held.vx) * (1 - Math.exp(-dt / 0.05));
      held.vy += (vy[i]! - held.vy) * (1 - Math.exp(-dt / 0.05));
    }
  };

  const rayTo = (clientX: number, clientY: number): Vec3 => {
    const rect = container.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / Math.max(rect.height, 1)) * 2;
    return [nx * view.tan * (view.width / view.height), ny * view.tan, -1];
  };

  const onPlane = (ray: Vec3, z: number): [number, number] => {
    const t = (z - CAMERA_Z) / ray[2];
    return [ray[0] * t, ray[1] * t];
  };

  const pick = (ray: Vec3) => {
    const len = Math.hypot(ray[0], ray[1], ray[2]);
    const dx = ray[0] / len;
    const dy = ray[1] / len;
    const dz = ray[2] / len;
    let best = -1;
    let bestT = Infinity;
    for (let i = 0; i < n; i++) {
      const ox = -px[i]!;
      const oy = -py[i]!;
      const oz = CAMERA_Z - pz[i]!;
      const b = ox * dx + oy * dy + oz * dz;
      const r = rad[i]! * 1.15;
      const c = ox * ox + oy * oy + oz * oz - r * r;
      const disc = b * b - c;
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < bestT) {
        bestT = t;
        best = i;
      }
    }
    return best;
  };

  const burst = (x: number, y: number) => {
    const s = read();
    const reach = view.halfH * 0.7;
    for (let i = 0; i < n; i++) {
      const dx = px[i]! - x;
      const dy = py[i]! - y;
      const dz = pz[i]!;
      const d = Math.hypot(dx, dy, dz);
      if (d >= reach || d < 1e-4) continue;
      const f = (1 - d / reach) ** 2 * 26 * (1 + 0.6 / (rad[i]! + 0.4));
      vx[i]! += (dx / d) * f;
      vy[i]! += (dy / d) * f + f * 0.25;
      vz[i]! += (dz / d) * f * 0.5;
    }
    light.x = x;
    light.y = y;
    light.z = Math.max(s.depth, 1) + 1.5;
    light.flash = 1;
  };

  let sizedDpr = read().dpr;

  const draw = () => {
    const s = read();
    const mat = MATERIALS[s.material];
    let count = 0;
    const total = n + 1;
    const depthOf = (item: number) => (item === n ? cursor.z : pz[item]!);
    for (let a = 1; a < total; a++) {
      const item = order[a]!;
      const z = depthOf(item);
      let b = a - 1;
      while (b >= 0 && depthOf(order[b]!) > z) {
        order[b + 1] = order[b]!;
        b--;
      }
      order[b + 1] = item;
    }
    for (let k = 0; k < total; k++) {
      const i = order[k]!;
      const o = count * STRIDE;
      if (i === n) {
        if (cursor.r < 0.01 || !s.followCursor) continue;
        const c = palette[0] ?? FALLBACK_COLOR;
        data[o] = cursor.x;
        data[o + 1] = cursor.y;
        data[o + 2] = cursor.z;
        data[o + 3] = cursor.r;
        data[o + 4] = c[0];
        data[o + 5] = c[1];
        data[o + 6] = c[2];
        data[o + 7] = 1;
        data[o + 8] = 0;
        data[o + 9] = 0;
        data[o + 10] = 0;
        data[o + 11] = 0;
      } else {
        const c = palette[tone[i]! % palette.length] ?? FALLBACK_COLOR;
        data[o] = px[i]!;
        data[o + 1] = py[i]!;
        data[o + 2] = pz[i]!;
        data[o + 3] = rad[i]!;
        data[o + 4] = c[0];
        data[o + 5] = c[1];
        data[o + 6] = c[2];
        data[o + 7] = 0;
        const ox = occ[i * 4]!;
        const oy = occ[i * 4 + 1]!;
        const oz = occ[i * 4 + 2]!;
        const len = Math.hypot(ox, oy, oz) || 1;
        data[o + 8] = ox / len;
        data[o + 9] = oy / len;
        data[o + 10] = oz / len;
        data[o + 11] = Math.min(occ[i * 4 + 3]! * 0.55, 1);
      }
      count++;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!count) return;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(shader.program);
    gl.uniformMatrix4fv(u.proj, false, projection);
    gl.uniform1f(u.cameraZ, CAMERA_Z);
    gl.uniform1f(u.pixel, (2 * view.tan) / canvas.height);
    const lc = toLinear(s.lightColor);
    const power = s.lightIntensity * 60 * (1 + light.flash * 3);
    gl.uniform3f(u.light, lc[0] * power, lc[1] * power, lc[2] * power);
    gl.uniform3f(u.lightPos, light.x, light.y, light.z - CAMERA_Z);
    gl.uniform1f(u.exposure, s.exposure);
    gl.uniform1f(u.shadow, s.shadows);
    gl.uniform4f(
      u.surface,
      mat.roughness,
      mat.metalness,
      mat.coat,
      mat.coatRoughness,
    );
    gl.uniform2f(u.extra, mat.scatter, mat.frost);
    gl.bindBuffer(gl.ARRAY_BUFFER, instances);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * STRIDE);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    gl.bindVertexArray(null);
  };

  const resize = () => {
    const s = read();
    sizedDpr = s.dpr;
    view.width = Math.max(1, container.clientWidth);
    view.height = Math.max(1, container.clientHeight);
    view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(view.width * view.ratio));
    canvas.height = Math.max(1, Math.round(view.height * view.ratio));
    const aspect = view.width / view.height;
    const base = Math.tan((FOV * Math.PI) / 360);
    view.tan = aspect > MAX_ASPECT ? (base * MAX_ASPECT) / aspect : base;
    view.halfH = view.tan * CAMERA_Z;
    view.halfW = view.halfH * aspect;
    view.fit = clamp(
      Math.sqrt(
        (view.halfW * view.halfH) /
          (base * base * CAMERA_Z * CAMERA_Z * MAX_ASPECT),
      ),
      0.4,
      1,
    );
    const f = 1 / view.tan;
    const near = 1;
    const far = 80;
    projection.fill(0);
    projection[0] = f / aspect;
    projection[5] = f;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = (2 * far * near) / (near - far);
    if (!n) sync(s, true);
    draw();
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const s = read();
    if (s.dpr !== sizedDpr) resize();
    const dt = last ? clamp((now - last) / 1000, 0, 1 / 20) : 1 / 60;
    last = now;
    elapsed += dt;
    glide = Math.max(0, glide - dt);
    sync(s, false);
    const targetR =
      s.followCursor && pointer.inside && held.index < 0
        ? s.cursorSize * view.fit
        : 0;
    cursor.r += (targetR - cursor.r) * (1 - Math.exp(-dt / 0.12));
    const follow = 1 - Math.exp(-dt / 0.06);
    const fromX = cursor.x;
    const fromY = cursor.y;
    cursor.x += (cursor.tx - cursor.x) * follow;
    cursor.y += (cursor.ty - cursor.y) * follow;
    cursor.vx = clamp(
      (cursor.x - fromX) / Math.max(dt, 1e-3),
      -MAX_SPEED,
      MAX_SPEED,
    );
    cursor.vy = clamp(
      (cursor.y - fromY) / Math.max(dt, 1e-3),
      -MAX_SPEED,
      MAX_SPEED,
    );
    let lx = 0;
    let ly = view.halfH * 0.75;
    let lz = s.depth + 4;
    if (pointer.inside) {
      lx = cursor.x;
      ly = cursor.y;
      lz = s.followCursor ? cursor.z : 1.5;
    } else if (light.flash > 0.05) {
      lx = light.x;
      ly = light.y;
      lz = light.z;
    }
    const lf = 1 - Math.exp(-dt / 0.08);
    light.x += (lx - light.x) * lf;
    light.y += (ly - light.y) * lf;
    light.z += (lz - light.z) * lf;
    light.flash *= Math.exp(-dt / 0.3);
    if (dt > 1e-4) {
      const steps = Math.min(6, Math.max(1, Math.ceil(dt / (1 / 180))));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) step(s, h, k === steps - 1);
    }
    draw();
    let moved = 0;
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      const d =
        Math.abs(px[i]! - still[k]!) +
        Math.abs(py[i]! - still[k + 1]!) +
        Math.abs(pz[i]! - still[k + 2]!);
      if (d > moved) moved = d;
      still[k] = px[i]!;
      still[k + 1] = py[i]!;
      still[k + 2] = pz[i]!;
    }
    const motion = moved / Math.max(dt, 1e-3);
    const busy =
      motion > 0.6 ||
      pointer.inside ||
      held.index >= 0 ||
      light.flash > 0.01 ||
      glide > 0 ||
      cursor.r > 0.01 ||
      (s.drift > 0 && !s.reduce);
    quiet = busy ? 0 : quiet + dt;
    if (quiet < 0.8) raf = requestAnimationFrame(frame);
  };

  function wake() {
    quiet = 0;
    if (!raf && visible && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  const inside = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
  };

  const aim = (event: PointerEvent) => {
    const ray = rayTo(event.clientX, event.clientY);
    const [x, y] = onPlane(ray, cursor.z);
    cursor.tx = x;
    cursor.ty = y;
    if (held.index >= 0) {
      const [hx, hy] = onPlane(ray, pz[held.index]!);
      held.tx = hx - held.ox;
      held.ty = hy - held.oy;
    }
    return ray;
  };

  const interactive = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest(
      'a, button, input, textarea, select, label, [role="button"]',
    ) !== null;

  const release = (event: PointerEvent | null) => {
    const s = read();
    if (held.index >= 0) {
      const i = held.index;
      const sp = Math.hypot(held.vx, held.vy);
      const k = sp > 22 ? 22 / sp : 1;
      vx[i] = held.vx * k;
      vy[i] = held.vy * k;
      held.index = -1;
      entered[i] = 1;
    } else if (
      event &&
      pointer.down &&
      !pointer.moved &&
      performance.now() - pointer.downAt < 400 &&
      s.clickEffect === 'burst' &&
      !s.reduce &&
      inside(event)
    ) {
      const [x, y] = onPlane(rayTo(event.clientX, event.clientY), 0);
      burst(x, y);
    }
    pointer.down = false;
    wake();
  };

  return {
    resize,
    wake,
    setVisible(next) {
      visible = next;
      if (visible) wake();
    },
    pointerMove(event) {
      const was = pointer.inside;
      pointer.inside = inside(event) || held.index >= 0;
      if (pointer.inside) {
        aim(event);
        if (!was) {
          cursor.x = cursor.tx;
          cursor.y = cursor.ty;
        }
        if (
          pointer.down &&
          Math.hypot(
            event.clientX - pointer.downX,
            event.clientY - pointer.downY,
          ) > 6
        )
          pointer.moved = true;
      }
      if (pointer.inside || was) wake();
    },
    pointerDown(event) {
      if (event.button !== 0 || !inside(event) || interactive(event.target))
        return;
      const s = read();
      pointer.down = true;
      pointer.moved = false;
      pointer.downX = event.clientX;
      pointer.downY = event.clientY;
      pointer.downAt = performance.now();
      const ray = aim(event);
      if (s.grab) {
        const i = pick(ray);
        if (i >= 0) {
          const [hx, hy] = onPlane(ray, pz[i]!);
          held.index = i;
          held.ox = hx - px[i]!;
          held.oy = hy - py[i]!;
          held.tx = px[i]!;
          held.ty = py[i]!;
          held.vx = 0;
          held.vy = 0;
          if (event.pointerType === 'mouse') event.preventDefault();
        }
      }
      wake();
    },
    pointerUp(event) {
      release(event);
    },
    pointerCancel() {
      release(null);
    },
    pointerLeave() {
      pointer.inside = held.index >= 0;
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      gl.deleteBuffer(quad);
      gl.deleteBuffer(instances);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(shader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
