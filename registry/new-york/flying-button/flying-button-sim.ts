import {
  ADVECT,
  BLUR,
  CURL,
  DIVERGENCE,
  DYE,
  FORCE,
  GRADIENT,
  PRESSURE,
  RENDER,
  SCALE,
  VERT,
  VORTICITY,
} from './flying-button-shaders';
import type {
  FlyingButtonFields,
  FlyingButtonPair,
  FlyingButtonProgram,
  FlyingButtonRenderInput,
  FlyingButtonSim,
  FlyingButtonStepInput,
  FlyingButtonTarget,
  FlyingButtonUniform,
} from './types';

export const SMOKE = {
  colSpread: 0.1,
  colR: 3.6,
  colD: 1.25,
  colU: 420,
  splash: 400,
  friction: 5,
  disperse: 0.6,
  dispV: 60,
  gap: 10,
  wind: 8,
  turb: 350,
  turbScale: 34,
  jetLight: 0.3,
  threshold: 0.035,
  blur: 3,
  emit: 0,
  exposure: 1.3,
  tone: 1,
  gamma: 0.6,
  kickNear: 45,
  kickW: 18,
  kickH: 14,
  vort: 6,
  spread: 0.1,
  floor: 0.02,
  keepD: 0.3,
  keepIdle: 0.45,
  keepH: 1.6,
  rateN: 0,
  rateH: 6,
  rateK: 20,
  rateC: 3,
  buoy: 330,
  lift: 22,
  damp: 0.55,
  radius: 6,
  speed: 380,
  reach: 0.9,
  forceMax: 240,
  alphaK: 4,
  relief: 9,
  shadow: 0.026,
  alphaLod: 0,
  ambient: 0.58,
  key: 0.82,
  wrap: 0.35,
  ao: 0.35,
  normalE: 3,
  normalLod: -0.8,
  fine: 0.35,
  broad: 0.9,
  iters: 28,
};

export function createSim(gl: WebGL2RenderingContext): FlyingButtonSim {
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type);
    if (!sh) throw new Error('shader');
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(log || 'shader');
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const programs: FlyingButtonProgram[] = [];
  const make = (src: string): FlyingButtonProgram => {
    const fs = compile(gl.FRAGMENT_SHADER, src);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(p) || 'program');
    gl.deleteShader(fs);
    const u: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
      const info = gl.getActiveUniform(p, i);
      if (!info) continue;
      u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
    }
    const prog = { p, u };
    programs.push(prog);
    return prog;
  };

  const P = {
    advect: make(ADVECT),
    force: make(FORCE),
    curl: make(CURL),
    vorticity: make(VORTICITY),
    divergence: make(DIVERGENCE),
    pressure: make(PRESSURE),
    gradient: make(GRADIENT),
    scale: make(SCALE),
    blur: make(BLUR),
    dye: make(DYE),
    render: make(RENDER),
  };

  const vao = gl.createVertexArray();
  const targets: FlyingButtonTarget[] = [];

  const target = (
    w: number,
    h: number,
    internal: number,
    mips: boolean,
  ): FlyingButtonTarget => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, internal, w, h);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const t = { tex, fbo, w, h, mips };
    targets.push(t);
    return t;
  };
  const pair = (
    w: number,
    h: number,
    internal: number,
    mips: boolean,
  ): FlyingButtonPair => {
    const p: FlyingButtonPair = {
      read: target(w, h, internal, mips),
      write: target(w, h, internal, mips),
      swap: () => {
        const t = p.read;
        p.read = p.write;
        p.write = t;
      },
    };
    return p;
  };

  let f: FlyingButtonFields | null = null;
  let world = [1, 1];

  const free = () => {
    targets.forEach((t) => {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    });
    targets.length = 0;
  };

  const resize = (W: number, H: number) => {
    const cell = Math.max(2, W / 520, H / 300);
    const vw = Math.max(16, Math.round(W / cell));
    const vh = Math.max(16, Math.round(H / cell));
    const dw = Math.max(16, Math.round(W / (cell / 2)));
    const dh = Math.max(16, Math.round(H / (cell / 2)));
    world = [W, H];
    if (f && f.vw === vw && f.vh === vh && f.dw === dw && f.dh === dh) return;
    free();
    f = {
      vw,
      vh,
      dw,
      dh,
      velocity: pair(vw, vh, gl.RG16F, false),
      pressure: pair(vw, vh, gl.R16F, false),
      divergence: target(vw, vh, gl.R16F, false),
      curl: target(vw, vh, gl.R16F, false),
      dye: pair(dw, dh, gl.RG16F, false),
      soft: target(dw, dh, gl.RG16F, true),
      temp: target(dw, dh, gl.RG16F, false),
    };
  };

  let unit = 0;
  const bind = (
    prog: FlyingButtonProgram,
    values: Record<string, FlyingButtonUniform>,
  ) => {
    gl.useProgram(prog.p);
    unit = 0;
    Object.entries(values).forEach(([name, v]) => {
      const loc = prog.u[name];
      if (loc === undefined || loc === null) return;
      if (typeof v === 'number') gl.uniform1f(loc, v);
      else if ('f1' in v) gl.uniform1fv(loc, v.f1);
      else if ('tex' in v) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v.tex);
        gl.uniform1i(loc, unit);
        unit += 1;
      } else if (v.length === 2) gl.uniform2fv(loc, v);
      else if (v.length === 3) gl.uniform3fv(loc, v);
      else gl.uniform4fv(loc, v);
    });
  };
  const run = (
    prog: FlyingButtonProgram,
    values: Record<string, FlyingButtonUniform>,
    out?: FlyingButtonTarget,
  ) => {
    bind(prog, values);
    if (out) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
      gl.viewport(0, 0, out.w, out.h);
    }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const step = (dt: number, o: FlyingButtonStepInput) => {
    if (!f) return;
    const K = SMOKE;
    gl.disable(gl.BLEND);
    const vt = [1 / f.vw, 1 / f.vh];
    run(
      P.advect,
      {
        uVelocity: f.velocity.read,
        uSource: f.velocity.read,
        uWorld: world,
        uDt: dt,
        uKeep: 1,
      },
      f.velocity.write,
    );
    f.velocity.swap();
    run(
      P.force,
      {
        uVelocity: f.velocity.read,
        uDye: f.soft,
        uWorld: world,
        uDt: dt,
        uBuoyancy: K.buoy,
        uLift: K.lift,
        uDamping: K.damp,
        uSpread: K.spread,
        uSplash: K.splash,
        uFriction: K.friction,
        uWind: o.wind,
        uTurb: [K.turb * (0.35 + 0.65 * o.activity), K.turbScale],
        uTime: o.time,
        uObstacle: o.calm,
        uKick: [K.kickNear * o.scale, K.kickW * o.scale, K.kickH * o.scale],
        uCraft: o.craft,
        uCraftMotion: o.motion,
        uJetA: o.jets.a,
        uJetB: o.jets.b,
        uJetBend: { f1: o.jets.bend },
      },
      f.velocity.write,
    );
    f.velocity.swap();
    run(P.curl, { uVelocity: f.velocity.read, uTexel: vt }, f.curl);
    run(
      P.vorticity,
      {
        uVelocity: f.velocity.read,
        uCurl: f.curl,
        uTexel: vt,
        uStrength: K.vort * o.turbulence * (0.4 + 0.6 * o.activity),
        uDt: dt,
      },
      f.velocity.write,
    );
    f.velocity.swap();
    run(P.divergence, { uVelocity: f.velocity.read, uTexel: vt }, f.divergence);
    run(P.scale, { uSource: f.pressure.read, uScale: 0.8 }, f.pressure.write);
    f.pressure.swap();
    for (let i = 0; i < K.iters; i += 1) {
      run(
        P.pressure,
        { uPressure: f.pressure.read, uDivergence: f.divergence, uTexel: vt },
        f.pressure.write,
      );
      f.pressure.swap();
    }
    run(
      P.gradient,
      { uPressure: f.pressure.read, uVelocity: f.velocity.read, uTexel: vt },
      f.velocity.write,
    );
    f.velocity.swap();

    run(
      P.dye,
      {
        uVelocity: f.velocity.read,
        uSource: f.dye.read,
        uWorld: world,
        uDt: dt,
        uKeep: [
          Math.exp(-(K.keepD + K.keepIdle * (1 - o.activity)) * dt),
          Math.exp(-K.keepH * dt),
        ],
        uRate: [
          K.rateN * o.smoke,
          K.rateH,
          K.rateK * o.smoke,
          K.rateC * o.smoke,
        ],
        uSpread: K.spread,
        uCol: [K.colSpread, K.colR * o.scale, K.colD, K.colU],
        uKick: [K.kickNear * o.scale, K.kickW * o.scale, K.kickH * o.scale],
        uDisperse: K.disperse,
        uDispV: K.dispV,
        uCraft: o.craft,
        uCraftMotion: o.motion,
        uGap: [o.spacing, K.gap * o.calm],
        uJetX: { f1: o.jetX },
        uJetN: o.jetN,
        uFloor: K.floor,
        uTime: o.time,
        uJetA: o.jets.a,
        uJetB: o.jets.b,
        uJetBend: { f1: o.jets.bend },
      },
      f.dye.write,
    );
    f.dye.swap();
    const spread = K.blur / 2;
    run(P.blur, { uSource: f.dye.read, uStep: [spread / f.dw, 0] }, f.temp);
    run(P.blur, { uSource: f.temp, uStep: [0, spread / f.dh] }, f.soft);
    gl.bindTexture(gl.TEXTURE_2D, f.soft.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const render = (cw: number, ch: number, o: FlyingButtonRenderInput) => {
    if (!f) return;
    const K = SMOKE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.BLEND);
    run(P.render, {
      uDye: f.soft,
      uWorld: world,
      uDyeSize: [f.dw, f.dh],
      uTime: o.time,
      uLightTheme: o.light ? 1 : 0,
      uSmoke: o.smokeColor,
      uShade: o.shadeColor,
      uThrust: o.thrustColor,
      uLook: [
        K.alphaK * (0.6 + 0.4 * o.activity),
        K.relief,
        K.shadow,
        K.alphaLod,
      ],
      uLook2: [K.ambient, K.key, K.wrap, K.ao],
      uLook3: [K.normalE, K.normalLod, K.fine, K.broad],
      uCol: [K.colSpread, K.colR * o.scale, K.colD, K.colU],
      uScale: o.scale,
      uGamma: K.gamma,
      uTone: K.tone,
      uLight2: [K.jetLight, K.emit, K.exposure],
      uThreshold: K.threshold * (0.3 + 0.7 * o.activity),
      uCraft: o.craft,
      uCraftMotion: o.motion,
      uJetA: o.jets.a,
      uJetB: o.jets.b,
      uJetBend: { f1: o.jets.bend },
    });
  };

  const clear = () => {
    if (!f) return;
    [
      f.velocity.read,
      f.velocity.write,
      f.pressure.read,
      f.pressure.write,
      f.dye.read,
      f.dye.write,
      f.soft,
      f.temp,
    ].forEach((t) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindTexture(gl.TEXTURE_2D, f.soft.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const dispose = () => {
    free();
    programs.forEach((p) => gl.deleteProgram(p.p));
    gl.deleteShader(vs);
    gl.deleteVertexArray(vao);
  };

  return { step, render, resize, clear, dispose };
}
