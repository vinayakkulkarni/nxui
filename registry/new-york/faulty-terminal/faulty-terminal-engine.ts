import {
  CELL_FRAGMENT,
  CLICKS,
  CLICK_SECONDS,
  GLYPHS,
  INTRO_SECONDS,
  MAIN_FRAGMENT,
  MAX_CLICKS,
  VERTEX,
} from './faulty-terminal-shaders';
import type {
  FaultyTerminalEngine,
  FaultyTerminalProps,
  FaultyTerminalSettings,
} from './types';

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Linked {
  program: WebGLProgram;
  uniforms: Uniforms;
}

interface Target {
  rings: WebGLTexture;
  extra: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function hexToRgb(hex: string): [number, number, number] {
  let h = String(hex || '#ffffff')
    .replace('#', '')
    .trim();
  if (h.length === 3 || h.length === 4)
    h = h
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  const num = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

/** Clamps and normalises the public props into what the shaders read. */
export function toSettings(
  props: Required<Omit<FaultyTerminalProps, 'class' | 'variation' | 'dpr'>> &
    Pick<FaultyTerminalProps, 'dpr'>,
): FaultyTerminalSettings {
  return {
    scale: Math.max(0.05, props.scale),
    gridX: Math.max(0.1, (props.gridMul[0] ?? 2) * 15),
    gridY: Math.max(0.1, (props.gridMul[1] ?? 1) * 15),
    digitSize: props.digitSize,
    timeScale: props.timeScale,
    pause: props.pause,
    scanlineIntensity: props.scanlineIntensity,
    glitchAmount: props.glitchAmount,
    flickerAmount: props.flickerAmount,
    noiseAmp: props.noiseAmp,
    chromaticAberration: props.chromaticAberration,
    dither:
      typeof props.dither === 'boolean' ? (props.dither ? 1 : 0) : props.dither,
    curvature: props.curvature,
    tint: hexToRgb(props.tint),
    mouseReact: props.mouseReact,
    mouseStrength: props.mouseStrength,
    pageLoadAnimation: props.pageLoadAnimation,
    brightness: props.brightness,
    glyphs: GLYPHS[props.glyphs] ?? 0,
    glow: clamp(props.glow, 0, 3),
    persistence: clamp(props.persistence, 0, 1),
    scramble: clamp(props.scramble, 0, 1),
    mouseGlow: clamp(props.mouseGlow, 0, 1),
    vignette: clamp(props.vignette, 0, 1),
    clickEffect: CLICKS[props.clickEffect] ?? 0,
    clickSeconds: CLICK_SECONDS[props.clickEffect] ?? 1,
    lightMode: props.lightMode,
    dpr: props.dpr,
  };
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): Linked | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Uniforms = {};
  const count: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
}

/**
 * Builds the two-pass terminal renderer: a per-cell pass that keeps phosphor
 * persistence in ping-pong textures, and a screen pass that draws the glyphs,
 * glow, glitches and CRT curvature. Returns null without WebGL2.
 */
export function createFaultyTerminalEngine(
  canvas: HTMLCanvasElement,
  getSettings: () => FaultyTerminalSettings,
  variation: number | undefined,
  reduceAtStart: boolean,
): FaultyTerminalEngine | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  const cellShader = link(gl, CELL_FRAGMENT);
  const mainShader = link(gl, MAIN_FRAGMENT);
  if (!cellShader || !mainShader) {
    if (cellShader) gl.deleteProgram(cellShader.program);
    if (mainShader) gl.deleteProgram(mainShader.program);
    return null;
  }
  const cu = cellShader.uniforms;
  const mu = mainShader.uniforms;
  const cl = (name: string) => cu[name] ?? null;
  const ml = (name: string) => mu[name] ?? null;
  const vao = gl.createVertexArray();

  const makeTexture = (): WebGLTexture => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    return texture;
  };
  const makeTarget = (): Target => {
    const rings = makeTexture();
    const extra = makeTexture();
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      rings,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      extra,
      0,
    );
    return { rings, extra, framebuffer };
  };
  const targets: [Target, Target] = [makeTarget(), makeTarget()];
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const targetAt = (index: number) => (index === 0 ? targets[0] : targets[1]);

  const view = { width: 1, height: 1, ratio: 1, columns: 1 };
  const cells = { x: 0, y: 0, w: 1, h: 1, key: '' };
  const pointer = { x: 0.5, y: 0.5, inside: false };
  const mouse = { x: 0.5, y: 0.5 };
  const clicks = new Float32Array(MAX_CLICKS * 4);
  const at = (index: number) => clicks[index] ?? 0;
  let clickIndex = 0;
  let clock = 0;
  let hover = 0;
  let current = 0;
  let fresh = true;
  const initialOffset =
    typeof variation === 'number' ? variation * 10 : Math.random() * 100;
  let iTime = initialOffset * getSettings().timeScale;
  let introClock = getSettings().pageLoadAnimation && !reduceAtStart ? 0 : 1;
  let last = 0;
  let quiet = 0;

  const layoutCells = (s: FaultyTerminalSettings) => {
    const reach = 1 + Math.max(0, s.curvature) * 2;
    const uvMin = 0.5 - 0.5 * reach;
    const uvMax = 0.5 + 0.5 * reach;
    const margin =
      0.06 *
        Math.max(1, Math.abs(s.glitchAmount)) *
        Math.max(1, Math.abs(s.flickerAmount)) +
      0.2;
    const gridX = s.gridX * view.columns;
    const x0 = Math.floor((uvMin * s.scale - margin) * gridX) - 2;
    const x1 = Math.floor((uvMax * s.scale + margin) * gridX) + 2;
    const y0 = Math.floor((uvMin * s.scale - margin) * s.gridY) - 2;
    const y1 = Math.floor((uvMax * s.scale + margin) * s.gridY) + 2;
    const key = `${x0}:${x1}:${y0}:${y1}`;
    if (key === cells.key) return;
    cells.key = key;
    cells.x = x0;
    cells.y = y0;
    cells.w = Math.max(1, Math.min(4096, x1 - x0 + 1));
    cells.h = Math.max(1, Math.min(4096, y1 - y0 + 1));
    for (const target of targets) {
      for (const texture of [target.rings, target.extra]) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          cells.w,
          cells.h,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
      }
    }
    fresh = true;
  };

  const stepCells = (s: FaultyTerminalSettings, decay: number) => {
    const source = targetAt(current);
    const target = targetAt(1 - current);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, cells.w, cells.h);
    gl.disable(gl.BLEND);
    gl.useProgram(cellShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.rings);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, source.extra);
    gl.uniform1i(cl('uPrev0'), 0);
    gl.uniform1i(cl('uPrev1'), 1);
    gl.uniform1f(cl('iTime'), iTime);
    gl.uniform2f(cl('uGridMul'), (s.gridX * view.columns) / 15, s.gridY / 15);
    gl.uniform1f(cl('uNoiseAmp'), s.noiseAmp);
    gl.uniform1f(cl('uScale'), s.scale);
    gl.uniform2f(cl('uMouse'), mouse.x, mouse.y);
    gl.uniform1f(cl('uMouseStrength'), s.mouseStrength);
    gl.uniform1f(cl('uUseMouse'), s.mouseReact ? 1 : 0);
    gl.uniform1f(cl('uPageLoadProgress'), introClock);
    gl.uniform1f(cl('uUsePageLoadAnimation'), s.pageLoadAnimation ? 1 : 0);
    gl.uniform2i(cl('uOrigin'), cells.x, cells.y);
    gl.uniform1f(cl('uDecay'), decay);
    gl.uniform1f(cl('uFresh'), fresh ? 1 : 0);
    gl.uniform1f(cl('uHover'), hover);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    current = 1 - current;
    fresh = false;
  };

  const draw = (s: FaultyTerminalSettings, reduce: boolean) => {
    const source = targetAt(current);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(mainShader.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.rings);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, source.extra);
    gl.uniform1i(ml('uRings0'), 0);
    gl.uniform1i(ml('uRings1'), 1);
    gl.uniform1f(ml('iTime'), iTime);
    gl.uniform3f(
      ml('iResolution'),
      canvas.width,
      canvas.height,
      canvas.width / canvas.height,
    );
    gl.uniform1f(ml('uScale'), s.scale);
    gl.uniform2f(ml('uGridMul'), (s.gridX * view.columns) / 15, s.gridY / 15);
    gl.uniform1f(ml('uDigitSize'), s.digitSize);
    gl.uniform1f(ml('uScanlineIntensity'), s.scanlineIntensity);
    gl.uniform1f(ml('uGlitchAmount'), reduce ? 0 : s.glitchAmount);
    gl.uniform1f(ml('uFlickerAmount'), reduce ? 0 : s.flickerAmount);
    gl.uniform1f(ml('uChromaticAberration'), s.chromaticAberration);
    gl.uniform1f(ml('uDither'), s.dither);
    gl.uniform1f(ml('uCurvature'), s.curvature);
    gl.uniform3fv(ml('uTint'), s.tint);
    gl.uniform1f(ml('uBrightness'), s.brightness);
    gl.uniform1f(ml('uLightMode'), s.lightMode ? 1 : 0);
    gl.uniform2i(ml('uOrigin'), cells.x, cells.y);
    gl.uniform2i(ml('uCellCount'), cells.w, cells.h);
    gl.uniform1i(ml('uGlyphs'), s.glyphs);
    gl.uniform1f(ml('uGlow'), s.glow);
    gl.uniform1f(ml('uScramble'), s.scramble);
    gl.uniform1f(ml('uMouseGlow'), s.mouseGlow);
    gl.uniform1f(ml('uVignette'), s.vignette);
    gl.uniform4fv(ml('uClicks'), clicks);
    gl.uniform1i(ml('uClickMode'), s.clickEffect);
    gl.uniform1f(ml('uClickSeconds'), s.clickSeconds);
    gl.uniform1f(ml('uClock'), clock);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  return {
    resize(width, height, devicePixelRatio) {
      const s = getSettings();
      view.width = Math.max(1, width);
      view.height = Math.max(1, height);
      view.ratio = Math.min(s.dpr || devicePixelRatio || 1, 2);
      view.columns = Math.min(1, view.width / view.height / 1.5);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      layoutCells(s);
      stepCells(s, 0);
      draw(s, reduceAtStart);
    },

    frame(now, reduce) {
      const s = getSettings();
      const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 20) : 1 / 60;
      last = now;
      clock += dt;
      if (!s.pause && !reduce) iTime += dt * s.timeScale;
      const targetX = pointer.inside ? pointer.x : 0.5;
      const targetY = pointer.inside ? pointer.y : 0.5;
      const follow = 1 - Math.exp(-dt / (pointer.inside ? 0.19988 : 0.6));
      mouse.x += (targetX - mouse.x) * follow;
      mouse.y += (targetY - mouse.y) * follow;
      hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt / 0.35));
      for (let k = 0; k < MAX_CLICKS; k++) {
        if (at(k * 4 + 3) > 0 && clock - at(k * 4 + 2) > s.clickSeconds)
          clicks[k * 4 + 3] = 0;
      }
      layoutCells(s);
      const decay =
        s.persistence > 0 ? Math.exp(-dt / (0.08 + s.persistence * 1.4)) : 0;
      stepCells(s, decay);
      draw(s, reduce);
      if (introClock < 1)
        introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      let busy = !(s.pause || reduce) || introClock < 1;
      busy =
        busy ||
        Math.abs(targetX - mouse.x) + Math.abs(targetY - mouse.y) > 0.0001;
      busy = busy || Math.abs((pointer.inside ? 1 : 0) - hover) > 0.001;
      for (let k = 0; k < MAX_CLICKS; k++) busy = busy || at(k * 4 + 3) > 0;
      quiet = busy ? 0 : quiet + dt;
      return quiet < 2.5;
    },

    wake(stopped) {
      quiet = 0;
      if (stopped) last = 0;
    },

    pointerMove(x, y, inside) {
      const was = pointer.inside;
      pointer.inside = inside;
      if (inside) {
        pointer.x = x;
        pointer.y = y;
      }
      return inside || was;
    },

    pointerLeave() {
      pointer.inside = false;
    },

    click(x, y, reduce) {
      if (reduce || !getSettings().clickEffect) return false;
      const o = clickIndex * 4;
      clicks[o] = x;
      clicks[o + 1] = y;
      clicks[o + 2] = clock;
      clicks[o + 3] = 1;
      clickIndex = (clickIndex + 1) % MAX_CLICKS;
      return true;
    },

    dispose() {
      for (const target of targets) {
        gl.deleteTexture(target.rings);
        gl.deleteTexture(target.extra);
        gl.deleteFramebuffer(target.framebuffer);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(cellShader.program);
      gl.deleteProgram(mainShader.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
