import { FRAGMENT, VERTEX } from './wave-shader';
import type { WaveFrame, WaveLook } from './types';

const UNIFORMS = [
  'uFirst',
  'uNext',
  'uSize',
  'uScale',
  'uSource',
  'uLean',
  'uReach',
  'uBand',
  'uPull',
  'uGlow',
  'uRim',
  'uSettle',
  'uTime',
  'uRefract',
  'uSplit',
  'uSparks',
  'uRadius',
  'uLight',
  'uColors',
] as const;

type Uniform = (typeof UNIFORMS)[number];

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error('shader');
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? 'compile');
  return s;
}

export interface WaveRenderer {
  /** Uploads the two views; either may be the same picture. */
  setViews: (first: TexImageSource, next: TexImageSource) => void;
  draw: (
    frame: WaveFrame,
    look: WaveLook,
    width: number,
    height: number,
  ) => void;
  dispose: () => void;
}

/** A WebGL 2 renderer on `canvas`, or null where WebGL 2 is missing. */
export function createWaveRenderer(
  canvas: HTMLCanvasElement,
): WaveRenderer | null {
  const gl = canvas.getContext('webgl2', {
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;
  let program: WebGLProgram;
  try {
    const p = gl.createProgram();
    if (!p) return null;
    gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    program = p;
  } catch {
    return null;
  }
  const buffer = gl.createBuffer();
  const textures = [gl.createTexture(), gl.createTexture()];
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const loc = new Map<Uniform, WebGLUniformLocation | null>();
  for (const name of UNIFORMS)
    loc.set(name, gl.getUniformLocation(program, name));
  const at = (name: Uniform) => loc.get(name) ?? null;
  const colors = new Float32Array(12);

  const upload = (tex: WebGLTexture | null, source: TexImageSource) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  return {
    setViews(first, next) {
      upload(textures[0] ?? null, first);
      upload(textures[1] ?? null, next);
    },
    draw(f, look, width, height) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0] ?? null);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[1] ?? null);
      gl.uniform1i(at('uFirst'), 0);
      gl.uniform1i(at('uNext'), 1);
      gl.uniform2f(at('uSize'), width, height);
      gl.uniform1f(at('uScale'), canvas.width / width);
      gl.uniform4f(at('uSource'), f.cx, f.cy, f.hw, f.hh);
      gl.uniform2f(at('uLean'), f.lx, f.ly);
      gl.uniform1f(at('uReach'), f.reach);
      gl.uniform1f(at('uBand'), f.band);
      gl.uniform1f(at('uPull'), f.pull);
      gl.uniform1f(at('uGlow'), f.glow);
      gl.uniform1f(at('uRim'), f.rim);
      gl.uniform1f(at('uSettle'), f.settle);
      gl.uniform1f(at('uTime'), f.time);
      gl.uniform1f(at('uRefract'), look.refraction);
      gl.uniform1f(at('uSplit'), look.aberration);
      gl.uniform1f(at('uSparks'), look.sparks ? 1 : 0);
      gl.uniform1f(at('uRadius'), look.radius);
      gl.uniform1f(at('uLight'), look.light ? 1 : 0);
      look.colors.forEach((c, i) => colors.set(c, i * 3));
      gl.uniform3fv(at('uColors'), colors);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      for (const t of textures) gl.deleteTexture(t);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
