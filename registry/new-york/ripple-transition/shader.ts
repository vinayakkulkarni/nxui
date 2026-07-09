export const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;

void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const FRAG = `
precision highp float;

uniform sampler2D u_texA;
uniform sampler2D u_texB;
uniform vec2 u_resolution;
uniform vec2 u_texASize;
uniform vec2 u_texBSize;
uniform vec2 u_center;
uniform float u_progress;
uniform float u_waveSpeed;
uniform float u_sigma;
uniform float u_waveFreq;
uniform float u_pushAmt;
uniform float u_caStrength;
uniform float u_glow;
uniform float u_noiseWarp;
uniform float u_swap;
uniform float u_pinch;

varying vec2 v_uv;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    val += amp * vnoise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }

  return val;
}

vec2 coverUv(vec2 uv, vec2 textureSize, vec2 resolution) {
  float textureAspect = textureSize.x / textureSize.y;
  float canvasAspect = resolution.x / resolution.y;
  vec2 scale = vec2(1.0);

  if (canvasAspect > textureAspect) {
    scale.y = textureAspect / canvasAspect;
  } else {
    scale.x = canvasAspect / textureAspect;
  }

  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = v_uv;
  vec2 size = u_resolution;
  vec2 center = u_center;

  vec2 p = uv - center;
  float aspect = size.x / size.y;
  p.x *= aspect;

  float dist = length(p);
  float maxDist = length(vec2(0.5 * aspect, 0.5));
  float normDist = clamp(dist / maxDist, 0.0, 1.0);

  float noiseLarge = fbm(p * 4.0 + vec2(u_progress * 1.0, u_progress * 0.5), 4);
  float noiseSmall = fbm(p * 12.0 + vec2(u_progress * 2.0, -u_progress * 1.5), 3);

  float waveFront = u_progress * u_waveSpeed;
  float warpScale = smoothstep(0.0, 0.05, u_progress);
  float warpedDist = normDist
    + (noiseLarge - 0.5) * u_noiseWarp * warpScale
    + (noiseSmall - 0.5) * (u_noiseWarp * 0.9) * warpScale;

  float delta = warpedDist - waveFront;
  float baseEnvelope = exp(-delta * delta / (2.0 * u_sigma * u_sigma));
  float ripples = max(0.0, cos(delta * u_waveFreq));
  float envelope = baseEnvelope * ripples;
  float gate = smoothstep(0.0, 0.05, u_progress) * (1.0 - smoothstep(0.85, 1.0, u_progress));
  envelope *= gate;

  vec2 dir = (dist > 0.001) ? normalize(p) : vec2(0.0);
  float pushAmt = envelope * u_pushAmt;
  float pinchSigma = 0.10;
  float pinchG = exp(-dist * dist / (2.0 * pinchSigma * pinchSigma));
  float pinchDisp = (dist / (pinchSigma * pinchSigma)) * pinchG * 0.01 * u_pinch;
  vec2 toEdge = min(uv, 1.0 - uv);
  float edgeFade = smoothstep(0.0, 0.14, min(toEdge.x, toEdge.y));
  pinchDisp *= edgeFade;

  vec2 uvOffset = dir * (pushAmt - pinchDisp);
  uvOffset.x /= aspect;

  float caStrength = envelope * u_caStrength;
  vec2 caOffset = dir * caStrength;
  caOffset.x /= aspect;

  vec2 uvR = uv - uvOffset - caOffset;
  vec2 uvG = uv - uvOffset;
  vec2 uvB = uv - uvOffset + caOffset;

  vec4 colorA = vec4(
    texture2D(u_texA, coverUv(uvR, u_texASize, size)).r,
    texture2D(u_texA, coverUv(uvG, u_texASize, size)).g,
    texture2D(u_texA, coverUv(uvB, u_texASize, size)).b,
    1.0
  );
  vec4 colorB = vec4(
    texture2D(u_texB, coverUv(uvR, u_texBSize, size)).r,
    texture2D(u_texB, coverUv(uvG, u_texBSize, size)).g,
    texture2D(u_texB, coverUv(uvB, u_texBSize, size)).b,
    1.0
  );

  float feather = 0.04 + 0.05 * noiseLarge;
  float reveal = smoothstep(waveFront + feather, waveFront - feather, warpedDist);
  reveal *= smoothstep(0.0, 0.05, u_progress);

  vec4 base = mix(colorA, colorB, u_swap);
  vec4 target = mix(colorB, colorA, u_swap);
  vec4 color = mix(base, target, reveal);

  float glow = envelope * u_glow;
  color.rgb = clamp(color.rgb / max(1.0 - glow, 0.01), 0.0, 1.0);
  color.rgb *= 1.0 - 0.16 * pinchG * edgeFade * u_pinch;

  gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
}
`;

export function compileShader(
  gl: WebGLRenderingContext,
  src: string,
  type: number,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader.');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Shader compile error.';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

export interface LoadedImage {
  image: HTMLImageElement;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () =>
      resolve({
        image,
        width: image.naturalWidth || image.width || 1,
        height: image.naturalHeight || image.height || 1,
      });
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function uploadTexture(
  gl: WebGLRenderingContext,
  unit: number,
  image: HTMLImageElement,
): WebGLTexture | null {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}
