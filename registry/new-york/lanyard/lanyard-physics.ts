import * as THREE from 'three';
import {
  ITERATIONS,
  JOINTS,
  MAX_STEP,
  NODE_WEIGHT,
  THICKNESS,
  BEVEL,
} from './lanyard-assets';
import type {
  LanyardBody,
  LanyardCardLayout,
  LanyardGrab,
  LanyardPhysics,
  LanyardSimulation,
} from './types';

const Z_AXIS = new THREE.Vector3(0, 0, 1);

export function createSimulation(): LanyardSimulation {
  const vectors = () =>
    Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(),
      mass: 1,
      inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3(),
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0,
  };
}

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion(),
};

function applyInverseInertia(
  body: LanyardBody,
  vector: THREE.Vector3,
  out: THREE.Vector3,
): THREE.Vector3 {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(
    out.x * body.inverseInertia.x,
    out.y * body.inverseInertia.y,
    out.z * body.inverseInertia.z,
  );
  return out.applyQuaternion(body.quaternion);
}

function rotateBody(q: THREE.Quaternion, w: THREE.Vector3) {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
}

function bodyWeight(
  body: LanyardBody,
  r: THREE.Vector3,
  normal: THREE.Vector3,
): number {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
}

function pushBody(body: LanyardBody, r: THREE.Vector3, impulse: THREE.Vector3) {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(
    body.quaternion,
    applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f),
  );
}

/** XPBD-style one-sided distance constraint: the band only pulls when stretched, with a soft tanh-limited tension. */
function solveSegment(
  sim: LanyardSimulation,
  i: number,
  h: number,
  physics: LanyardPhysics,
) {
  const { nodes, body } = sim;
  const a = nodes[i]!;
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1]!;
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]!) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i]!;
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] = sim.impulses[i]! + lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
}

function solvePin(body: LanyardBody, grab: LanyardGrab, target: THREE.Vector3) {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
}

/** Resets the band to hang straight down, or (intro) stretched sideways with the card rotated so it drops in. */
export function placeHanging(
  sim: LanyardSimulation,
  layout: LanyardCardLayout,
  intro: boolean,
) {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0]!.copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i]!.copy(nodes[i - 1]!);
    if (intro) nodes[i]!.x += sim.rest;
    else nodes[i]!.y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(Z_AXIS, Math.PI / 2);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]!).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i]!.copy(nodes[i]!);
    velocities[i]!.set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
}

export function configureSimulation(
  sim: LanyardSimulation,
  layout: LanyardCardLayout,
  length: number,
) {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height),
  );
  body.hang.set(0, layout.hangY, 0);
}

export function buildPhysics(
  gravityScale: number,
  elasticity: number,
  damping: number,
  breeze: number,
): LanyardPhysics {
  const gravity = 40 * Math.min(3, Math.max(0, gravityScale));
  const weight = Math.max(gravity, 20);
  const springy = Math.min(1, Math.max(0, elasticity));
  const settle = Math.min(1, Math.max(0, damping));
  const mixed = (a: number, b: number) => a + (b - a) * springy;
  return {
    gravity,
    hold: weight * mixed(2.2, 5.5),
    stiffness: weight * 10 * JOINTS,
    spring: weight * mixed(0.1, 0.4) * JOINTS,
    bandDamping: weight * mixed(0.3, 0.08) * JOINTS,
    linearDrag: 0.25 * Math.pow(16, settle),
    angularDrag: 0.5 * Math.pow(12, settle),
    air: 0.15,
    broadside: 0.5,
    spinAir: 0.03,
    nodeDrag: 2,
    nodeAir: 0.2,
    twist: 30,
    twistDamping: 3,
    grip: 40,
    gripDamping: 6,
    breeze: Math.min(1, Math.max(0, breeze)),
  };
}

/** Advances the band joints and the rigid card in fixed sub-steps (≤ 1/960 s). */
export function stepSimulation(
  sim: LanyardSimulation,
  dt: number,
  physics: LanyardPhysics,
  time: number,
) {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX =
    physics.breeze *
    (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) *
    3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i]!;
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i]!.copy(nodes[i]!);
      nodes[i]!.addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q
        .copy(grab.rotation)
        .multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a
        .set(turn.x, turn.y, turn.z)
        .multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(
        applyInverseInertia(body, torque, scratch.b),
        h,
      );
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(
        scratch.e.crossVectors(front, facing).dot(up),
        front.dot(facing),
      );
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(
        up,
        (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) *
          h,
      );
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i]!.subVectors(nodes[i]!, previous[i]!)
        .divideScalar(h)
        .multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q
      .copy(body.previousQuaternion)
      .invert()
      .premultiply(body.quaternion);
    body.angular
      .set(dq.x, dq.y, dq.z)
      .multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b
      .copy(body.velocity)
      .addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(
        normal,
        across / (1 + physics.broadside * Math.abs(across) * h),
      )
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(
      angularDrag / (1 + physics.spinAir * body.angular.length() * h),
    );
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS]!.copy(body.hang)
      .applyQuaternion(body.quaternion)
      .add(body.position);
    for (let i = 0; i < JOINTS; i++)
      sim.lengths[i] = nodes[i]!.distanceTo(nodes[i + 1]!);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i]!.lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
}
