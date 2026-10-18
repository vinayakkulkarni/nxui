import {
  AURORA_FLOW_FRAGMENT_SHADER,
  AURORA_FLOW_VERTEX_SHADER,
} from './aurora-flow-shader';
import type { AuroraFlowRenderer } from './types';

const UNIFORM_NAMES = [
  'u_res',
  'u_pointer',
  'u_flowDirection',
  'u_time',
  'u_speed',
  'u_animationSpeed',
  'u_intensity',
  'u_opacity',
  'u_blur',
  'u_contrast',
  'u_brightness',
  'u_layers',
  'u_flowScale',
  'u_flowStrength',
  'u_pointerStrength',
  'u_scroll',
  'u_parallaxStrength',
  'u_grainOpacity',
  'u_noiseOpacity',
  'u_noiseScale',
  'u_lighting',
  'u_lightingIntensity',
  'u_lightingRadius',
  'u_lightingSpeed',
  'u_ambientGlow',
  'u_ambientOpacity',
  'u_vignette',
  'u_color0',
  'u_color1',
  'u_color2',
  'u_color3',
  'u_color4',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

const COLOR_UNIFORMS: readonly UniformName[] = [
  'u_color0',
  'u_color1',
  'u_color2',
  'u_color3',
  'u_color4',
];

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createAuroraFlowRenderer(
  canvas: HTMLCanvasElement,
): AuroraFlowRenderer | null {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    AURORA_FLOW_VERTEX_SHADER,
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    AURORA_FLOW_FRAGMENT_SHADER,
  );
  const program = gl.createProgram();
  const buffer = gl.createBuffer();

  const release = () => {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  if (!vertexShader || !fragmentShader || !program || !buffer) {
    release();
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    release();
    return null;
  }

  gl.useProgram(program);
  const position = gl.getAttribLocation(program, 'position');
  if (position < 0) {
    release();
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = new Map<UniformName, WebGLUniformLocation>();
  for (const name of UNIFORM_NAMES) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
      release();
      return null;
    }
    uniforms.set(name, location);
  }

  const set1 = (name: UniformName, value: number) => {
    gl.uniform1f(uniforms.get(name) ?? null, value);
  };
  const set2 = (name: UniformName, x: number, y: number) => {
    gl.uniform2f(uniforms.get(name) ?? null, x, y);
  };

  return {
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      set2('u_res', width, height);
    },
    draw(frame) {
      const s = frame.settings;
      const radians = (s.flowDirection * Math.PI) / 180;
      set2('u_pointer', frame.pointerX, frame.pointerY);
      set2('u_flowDirection', Math.cos(radians), Math.sin(radians));
      set1('u_time', frame.time);
      set1('u_speed', s.speed);
      set1('u_animationSpeed', s.animationSpeed);
      set1('u_intensity', s.intensity);
      set1('u_opacity', s.opacity);
      set1('u_blur', s.blur);
      set1('u_contrast', s.contrast);
      set1('u_brightness', s.brightness);
      set1('u_layers', s.layers);
      set1('u_flowScale', s.flowScale);
      set1('u_flowStrength', s.flowStrength);
      set1('u_pointerStrength', frame.pointerStrength);
      set1('u_scroll', frame.scroll);
      set1('u_parallaxStrength', s.parallaxStrength);
      set1('u_grainOpacity', s.grainOpacity);
      set1('u_noiseOpacity', s.noiseOpacity);
      set1('u_noiseScale', s.noiseScale);
      set1('u_lighting', s.lighting);
      set1('u_lightingIntensity', s.lightingIntensity);
      set1('u_lightingRadius', s.lightingRadius);
      set1('u_lightingSpeed', s.lightingSpeed);
      set1('u_ambientGlow', s.ambientGlow);
      set1('u_ambientOpacity', s.ambientOpacity);
      set1('u_vignette', s.vignette);
      s.palette.forEach((color, index) => {
        const name = COLOR_UNIFORMS[index];
        if (!name) return;
        gl.uniform3f(uniforms.get(name) ?? null, color[0], color[1], color[2]);
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose: release,
  };
}
