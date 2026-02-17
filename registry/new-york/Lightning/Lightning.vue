<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      hue?: number;
      xOffset?: number;
      speed?: number;
      intensity?: number;
      size?: number;
      class?: string;
    }>(),
    {
      hue: 230,
      xOffset: 0,
      speed: 1,
      intensity: 1,
      size: 1,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let animationId = 0;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let startTime = 0;

  const VERT = `
    attribute vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uHue;
    uniform float uXOffset;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform float uSize;

    #define OCTAVE_COUNT 10

    vec3 hsv2rgb(vec3 c) {
      vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      return c.z * mix(vec3(1.0), rgb, c.y);
    }

    float hash11(float p) {
      p = fract(p * .1031);
      p *= p + 33.33;
      p *= p + p;
      return fract(p);
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    mat2 rotate2d(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat2(c, -s, s, c);
    }

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 fp = fract(p);
      float a = hash12(ip);
      float b = hash12(ip + vec2(1.0, 0.0));
      float c = hash12(ip + vec2(0.0, 1.0));
      float d = hash12(ip + vec2(1.0, 1.0));
      vec2 t = smoothstep(0.0, 1.0, fp);
      return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < OCTAVE_COUNT; ++i) {
        value += amplitude * noise(p);
        p *= rotate2d(0.45);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      uv = 2.0 * uv - 1.0;
      uv.x *= iResolution.x / iResolution.y;
      uv.x += uXOffset;
      uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
      float dist = abs(uv.x);
      vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
      vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(
    glCtx: WebGLRenderingContext,
    source: string,
    type: number,
  ): WebGLShader | null {
    const shader = glCtx.createShader(type);
    if (!shader) return null;
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function resizeCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  useResizeObserver(canvasRef, () => {
    resizeCanvas();
    if (gl) gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    resizeCanvas();
    gl = canvas.getContext('webgl');
    if (!gl) return;

    const vertexShader = compileShader(gl, VERT, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAG, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const uHueLoc = gl.getUniformLocation(program, 'uHue');
    const uXOffsetLoc = gl.getUniformLocation(program, 'uXOffset');
    const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');
    const uIntensityLoc = gl.getUniformLocation(program, 'uIntensity');
    const uSizeLoc = gl.getUniformLocation(program, 'uSize');

    startTime = performance.now();

    function render() {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(iTimeLoc, (performance.now() - startTime) / 1000.0);
      gl.uniform1f(uHueLoc, props.hue);
      gl.uniform1f(uXOffsetLoc, props.xOffset);
      gl.uniform1f(uSpeedLoc, props.speed);
      gl.uniform1f(uIntensityLoc, props.intensity);
      gl.uniform1f(uSizeLoc, props.size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    }
    animationId = requestAnimationFrame(render);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    if (gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
</script>

<template>
  <canvas ref="canvasRef" :class="cn('size-full', $props.class)" />
</template>
