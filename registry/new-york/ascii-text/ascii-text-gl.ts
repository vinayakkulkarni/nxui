export const ASCII_CHARSET =
  ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
export const ASCII_FONT =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
export const ASCII_COLORS = ['#ff6188', '#fc9867', '#ffd866'];
const GLYPH_WIDTH = 40;
export const GLYPH_HEIGHT = 64;
export const TEXT_PX = 256;
export const RIPPLES = 4;

export const UNIFORM_NAMES = [
  'uText',
  'uGlyphs',
  'uSize',
  'uCell',
  'uGlyphCount',
  'uTextAspect',
  'uPlaneHeight',
  'uTilt',
  'uTime',
  'uWaves',
  'uWaveSpeed',
  'uChroma',
  'uBlocks',
  'uColors',
  'uHue',
  'uPointer',
  'uHover',
  'uScramble',
  'uRipples',
  'uIntro',
  'uLight',
  'uReady',
] as const;

export type UniformName = (typeof UNIFORM_NAMES)[number];

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
#define RIPPLES ${RIPPLES}
uniform sampler2D uText;
uniform sampler2D uGlyphs;
uniform vec2 uSize;
uniform vec2 uCell;
uniform float uGlyphCount;
uniform float uTextAspect;
uniform float uPlaneHeight;
uniform vec2 uTilt;
uniform float uTime;
uniform float uWaves;
uniform float uWaveSpeed;
uniform float uChroma;
uniform float uBlocks;
uniform vec3 uColors[3];
uniform float uHue;
uniform vec2 uPointer;
uniform float uHover;
uniform float uScramble;
uniform vec4 uRipples[RIPPLES];
uniform float uIntro;
uniform float uLight;
uniform float uReady;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 hueRotate(vec3 color, float angle) {
  const vec3 axis = vec3(0.57735);
  float c = cos(angle);
  return color * c + cross(axis, color) * sin(angle) + axis * dot(axis, color) * (1.0 - c);
}

vec4 scene(vec2 pixel) {
  vec2 ndc = vec2(pixel.x / uSize.x * 2.0 - 1.0, 1.0 - pixel.y / uSize.y * 2.0);
  float tanHalf = 0.41421356;
  vec3 dir = normalize(vec3(ndc.x * tanHalf * uSize.x / uSize.y, ndc.y * tanHalf, -1.0));
  vec3 origin = vec3(0.0, 0.0, 30.0);
  float cx = cos(uTilt.x);
  float sx = sin(uTilt.x);
  float cy = cos(uTilt.y);
  float sy = sin(uTilt.y);
  mat3 rotation = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx) * mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  vec3 normal = rotation * vec3(0.0, 0.0, 1.0);
  float facing = dot(dir, normal);
  if (abs(facing) < 0.0001) return vec4(0.0);
  vec3 hit = origin + dir * (-dot(origin, normal) / facing);
  vec3 local = transpose(rotation) * hit;
  float planeHeight = 24.8528 * uPlaneHeight;
  float planeWidth = planeHeight * uTextAspect;
  float wave = 5.0 * sin(uTime * uWaveSpeed);
  local.x -= sin(wave + local.y) * 0.5 * uWaves;
  local.y -= cos(wave) * 0.15 * uWaves;
  local.xy /= 1.0 + sin(wave + local.x) * uWaves / 30.0;
  vec2 uv = vec2(local.x / planeWidth + 0.5, 0.5 - local.y / planeHeight);
  float t = sin(uTime);
  float red = texture(uText, uv + cos(t + uv.x) * 0.01 * uChroma).r;
  float green = texture(uText, uv + clamp(tan(uv.x - t * 0.5), -3.0, 3.0) * 0.01 * uChroma).g;
  float blue = texture(uText, uv - cos(t * 3.0 + uv.y) * 0.01 * uChroma).b;
  vec4 base = texture(uText, uv);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  return vec4(red, green, blue, base.a) * inside;
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 cell = floor(pixel / uCell);
  vec2 local = fract(pixel / uCell);
  vec2 center = (cell + 0.5) * uCell;
  float tick = floor(uTime * 18.0);

  float ring = 0.0;
  vec2 push = vec2(0.0);
  for (int i = 0; i < RIPPLES; i++) {
    vec4 ripple = uRipples[i];
    if (ripple.w <= 0.0) continue;
    float radius = ripple.z * max(uSize.x, uSize.y) * 0.75;
    float gap = abs(distance(center, ripple.xy) - radius);
    float band = max(uCell.y * 3.0, 24.0);
    float strength = (1.0 - smoothstep(0.0, 1.2, ripple.z)) * (1.0 - smoothstep(0.0, band, gap));
    ring = max(ring, strength);
    push += normalize(center - ripple.xy + 0.001) * strength * uCell.y * 1.5;
  }

  vec4 base = scene(center - push);
  float content = step(0.02, base.a);
  float gray = clamp(dot(base.rgb, vec3(0.3, 0.6, 0.1)), 0.0, 1.0);
  float index = content > 0.0 ? max(1.0, floor(gray * (uGlyphCount - 1.0) + 0.5)) : 0.0;
  float randomGlyph = 1.0 + floor(hash(cell * 1.7 + tick * 0.37) * (uGlyphCount - 1.0));

  float reach = uSize.y * 0.18 * (0.5 + uScramble);
  float scramble = uHover * uScramble * (1.0 - smoothstep(reach * 0.35, reach, distance(center, uPointer)));
  if (content > 0.0 && hash(cell + tick * 7.13) < scramble * 0.8) index = randomGlyph;
  if (hash(cell + tick * 3.1) < ring) index = randomGlyph;
  float decoding = step(hash(cell * 0.37 + 2.1), uIntro);
  if (content > 0.0 && decoding > 0.0) index = randomGlyph;

  float mask = texture(uGlyphs, vec2((index + local.x) / uGlyphCount, local.y)).a;
  float glyphAlpha = mask * max(content * (1.0 - decoding * 0.35), ring * 0.75);

  float spread = length((pixel - uSize * 0.5) / (uSize * 0.5)) * 0.7071;
  vec3 tint = mix(mix(uColors[0], uColors[1], smoothstep(0.0, 0.5, spread)), uColors[2], smoothstep(0.5, 1.0, spread));
  float blockAlpha = base.a * uBlocks * (1.0 - uIntro);
  vec3 under = base.rgb * blockAlpha;
  vec3 color = mix(under, abs(tint - under), glyphAlpha);
  float alpha = max(blockAlpha, glyphAlpha) * uReady;
  color = clamp(hueRotate(color, uHue), 0.0, 1.0) * uReady;
  if (uLight > 0.5) color = vec3(alpha) - color;
  fragColor = vec4(color, alpha);
}`;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

export function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

let colorCtx: CanvasRenderingContext2D | null = null;

/** Resolves any CSS color to normalized RGB via the canvas color parser. */
export function toRgb(color: string): [number, number, number] {
  colorCtx ??= document.createElement('canvas').getContext('2d');
  if (!colorCtx) return [1, 1, 1];
  colorCtx.fillStyle = '#ffffff';
  colorCtx.fillStyle = color;
  const value = String(colorCtx.fillStyle);
  if (value.startsWith('#')) {
    const hex = Number.parseInt(value.slice(1, 7), 16);
    return [
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255,
    ];
  }
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255];
  return [
    (parts[0] ?? 255) / 255,
    (parts[1] ?? 255) / 255,
    (parts[2] ?? 255) / 255,
  ];
}

export function drawText(
  text: string,
  fontFamily: string,
  fontWeight: number,
  color: string,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const font = `${fontWeight} ${TEXT_PX}px ${fontFamily}`;
  ctx.font = font;
  const width = Math.max(TEXT_PX * 0.6, ctx.measureText(text || ' ').width);
  canvas.width = Math.ceil(width + TEXT_PX * 0.3);
  canvas.height = Math.ceil(TEXT_PX * 1.3);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas;
}

export function drawGlyphs(
  charset: string,
  fontFamily: string,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const chars = Array.from(charset);
  canvas.width = chars.length * GLYPH_WIDTH;
  canvas.height = GLYPH_HEIGHT;
  ctx.font = `500 ${GLYPH_HEIGHT * 0.74}px ${fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((char, i) => {
    ctx.fillText(
      char,
      i * GLYPH_WIDTH + GLYPH_WIDTH / 2,
      GLYPH_HEIGHT / 2 + GLYPH_HEIGHT * 0.04,
    );
  });
  return canvas;
}

export function uploadTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: HTMLCanvasElement,
  smooth: boolean,
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    smooth ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST,
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    smooth ? gl.LINEAR : gl.NEAREST,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
