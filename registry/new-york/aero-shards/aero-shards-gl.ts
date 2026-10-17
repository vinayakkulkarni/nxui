import type { AeroShardsTarget } from './types';

export interface AeroShardsProgram {
  program: WebGLProgram;
  locations: Map<string, WebGLUniformLocation | null>;
}

function compileShader(
  gl: WebGL2RenderingContext,
  kind: number,
  source: string,
) {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error('AeroShards: could not create a shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? '';
    gl.deleteShader(shader);
    throw new Error(`AeroShards: shader failed to compile\n${log}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
): AeroShardsProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('AeroShards: could not create a program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? '';
    gl.deleteProgram(program);
    throw new Error(`AeroShards: program failed to link\n${log}`);
  }
  return { program, locations: new Map() };
}

export function uniformAt(
  gl: WebGL2RenderingContext,
  program: AeroShardsProgram,
  name: string,
) {
  if (!program.locations.has(name)) {
    program.locations.set(name, gl.getUniformLocation(program.program, name));
  }
  return program.locations.get(name) ?? null;
}

export function setVec4(
  gl: WebGL2RenderingContext,
  program: AeroShardsProgram,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
) {
  gl.uniform4f(uniformAt(gl, program, name), x, y, z, w);
}

export function setTexture(
  gl: WebGL2RenderingContext,
  program: AeroShardsProgram,
  name: string,
  unit: number,
  texture: WebGLTexture | null,
) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniformAt(gl, program, name), unit);
}

export interface AeroShardsTextureFormat {
  internal: number;
  type: number;
}

function allocate(
  gl: WebGL2RenderingContext,
  target: AeroShardsTarget,
  format: AeroShardsTextureFormat,
) {
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    format.internal,
    target.width,
    target.height,
    0,
    gl.RGBA,
    format.type,
    null,
  );
  if (target.depth) {
    gl.bindTexture(gl.TEXTURE_2D, target.depth);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT32F,
      target.width,
      target.height,
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null,
    );
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function makeTexture(gl: WebGL2RenderingContext, filter: number) {
  const texture = gl.createTexture();
  if (!texture) throw new Error('AeroShards: could not create a texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export function createTarget(
  gl: WebGL2RenderingContext,
  format: AeroShardsTextureFormat,
  size: [number, number],
  withDepth: boolean,
): AeroShardsTarget {
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error('AeroShards: could not create a framebuffer');
  const target: AeroShardsTarget = {
    texture: makeTexture(gl, gl.LINEAR),
    depth: withDepth ? makeTexture(gl, gl.NEAREST) : null,
    fbo,
    width: Math.max(1, size[0]),
    height: Math.max(1, size[1]),
  };
  allocate(gl, target, format);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    target.texture,
    0,
  );
  if (target.depth) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      target.depth,
      0,
    );
  }
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`AeroShards: framebuffer incomplete (${status})`);
  }
  return target;
}

export function resizeTarget(
  gl: WebGL2RenderingContext,
  target: AeroShardsTarget,
  format: AeroShardsTextureFormat,
  size: [number, number],
) {
  const width = Math.max(1, size[0]);
  const height = Math.max(1, size[1]);
  if (width === target.width && height === target.height) return;
  target.width = width;
  target.height = height;
  allocate(gl, target, format);
}

export function deleteTarget(
  gl: WebGL2RenderingContext,
  target: AeroShardsTarget,
) {
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.texture);
  if (target.depth) gl.deleteTexture(target.depth);
}

export function bindTarget(
  gl: WebGL2RenderingContext,
  target: AeroShardsTarget | null,
  width: number,
  height: number,
) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
  gl.viewport(
    0,
    0,
    target ? target.width : width,
    target ? target.height : height,
  );
}
