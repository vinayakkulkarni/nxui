import { Renderer, Triangle, Program, Mesh, Texture } from 'ogl';
import type { OGLRenderingContext } from 'ogl';
import { MORPH_FRAGMENT, MORPH_VERTEX } from './morph-shaders';
import { MORPH_TRANSITIONS, morphHexToRgb } from './morph-defaults';
import { resolveEase } from './morph-ease';
import type {
  MorphEngineConfig,
  MorphEngineOptions,
  MorphItem,
  MorphTween,
} from './types';

function makeFallbackTexture(gl: OGLRenderingContext): Texture {
  const size = 4;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 24;
    data[i * 4 + 1] = 24;
    data[i * 4 + 2] = 28;
    data[i * 4 + 3] = 255;
  }
  return new Texture(gl, {
    image: data,
    width: size,
    height: size,
    generateMipmaps: false,
  });
}

export class MorphEngine {
  private container: HTMLElement;
  private items: MorphItem[];
  private getOptions: () => MorphEngineOptions;
  private onIndexChange: (index: number) => void;
  private reducedMotion: boolean;

  private current: number;
  private animating = false;
  private dragging = false;
  private dragDir = 0;
  private shownIndex: number;
  private progress = 0;
  private tween: MorphTween | null = null;

  private renderer: Renderer;
  private gl: OGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private program: Program;
  private mesh: Mesh;
  private textures: Texture[];
  private sizes: [number, number][];
  private images: HTMLImageElement[] = [];
  private resizeObserver: ResizeObserver;
  private raf = 0;
  private lastT = -1;
  private running = false;
  private destroyed = false;

  constructor(container: HTMLElement, config: MorphEngineConfig) {
    this.container = container;
    this.items = config.items;
    this.getOptions = config.getOptions;
    this.onIndexChange = config.onIndexChange;
    this.reducedMotion = config.reducedMotion;
    this.current = config.startIndex;
    this.shownIndex = config.startIndex;

    this.renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, config.dprCap),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0.05, 0.05, 0.06, 1);

    this.canvas = this.gl.canvas;
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    this.textures = this.items.map(() => makeFallbackTexture(this.gl));
    this.sizes = this.items.map((): [number, number] => [1, 1]);

    const opts = this.getOptions();
    this.program = new Program(this.gl, {
      vertex: MORPH_VERTEX,
      fragment: MORPH_FRAGMENT,
      uniforms: {
        tCurrent: { value: this.textures[this.current] },
        tNext: { value: this.textures[this.current] },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: this.sizes[this.current] },
        uNextSize: { value: this.sizes[this.current] },
        uProgress: { value: 0 },
        uDir: { value: 1 },
        uMode: { value: MORPH_TRANSITIONS[opts.transition] ?? 0 },
        uIntensity: { value: opts.intensity },
        uScale: { value: opts.scale },
        uAberration: { value: opts.aberration },
        uDrift: { value: opts.drift },
        uTime: { value: 0 },
        uReduce: { value: this.reducedMotion ? 1 : 0 },
        uPointer: { value: [0.5, 0.5] },
        uOverlay: { value: morphHexToRgb(opts.overlayColor) },
      },
    });

    this.mesh = new Mesh(this.gl, {
      geometry: new Triangle(this.gl),
      program: this.program,
    });

    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.loadTextures();
    this.setActive(true);
  }

  private loadTextures(): void {
    this.items.forEach((item, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        if (this.destroyed) return;
        const texture = new Texture(this.gl, { generateMipmaps: false });
        texture.image = img;
        const old = this.textures[index];
        this.textures[index] = texture;
        this.sizes[index] = [img.naturalWidth || 1, img.naturalHeight || 1];
        const u = this.program.uniforms;
        if (u.tCurrent.value === old) {
          u.tCurrent.value = texture;
          u.uCurrentSize.value = this.sizes[index];
        }
        if (u.tNext.value === old) {
          u.tNext.value = texture;
          u.uNextSize.value = this.sizes[index];
        }
        if (old?.texture) this.gl.deleteTexture(old.texture);
      };
      img.src = item.image;
      this.images.push(img);
    });
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1));
    this.program.uniforms.uResolution.value = [
      this.gl.canvas.width,
      this.gl.canvas.height,
    ];
  }

  private syncOptions(): void {
    const opts = this.getOptions();
    const u = this.program.uniforms;
    u.uMode.value = MORPH_TRANSITIONS[opts.transition] ?? 0;
    u.uIntensity.value = opts.intensity;
    u.uScale.value = opts.scale;
    u.uAberration.value = opts.aberration;
    u.uDrift.value = opts.drift;
    u.uOverlay.value = morphHexToRgb(opts.overlayColor);
  }

  private loop = (t: number): void => {
    const dt = this.lastT < 0 ? 0 : Math.min((t - this.lastT) / 1000, 0.1);
    this.lastT = t;
    this.stepTween(dt);
    const u = this.program.uniforms;
    u.uTime.value = t * 0.001;
    u.uProgress.value = this.progress;
    if (!this.dragging && !this.animating) this.syncOptions();
    this.renderer.render({ scene: this.mesh });
    this.raf = requestAnimationFrame(this.loop);
  };

  private stepTween(dt: number): void {
    const tw = this.tween;
    if (!tw) return;
    tw.elapsed += dt;
    const k = tw.duration <= 0 ? 1 : Math.min(tw.elapsed / tw.duration, 1);
    this.progress = tw.from + (tw.to - tw.from) * tw.ease(k);
    if (k >= 1) {
      this.tween = null;
      tw.onComplete();
    }
  }

  private startTween(
    to: number,
    duration: number,
    ease: string,
    onComplete: () => void,
  ): void {
    this.tween = {
      from: this.progress,
      to,
      elapsed: 0,
      duration,
      ease: resolveEase(ease),
      onComplete,
    };
  }

  /** Pause/resume the render loop (used when the slider leaves the viewport). */
  setActive(active: boolean): void {
    if (this.destroyed || active === this.running) return;
    this.running = active;
    if (active) {
      this.lastT = -1;
      this.raf = requestAnimationFrame(this.loop);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  setReducedMotion(reduce: boolean): void {
    this.reducedMotion = reduce;
    this.program.uniforms.uReduce.value = reduce ? 1 : 0;
  }

  private wrap(i: number): number {
    const n = this.items.length;
    return ((i % n) + n) % n;
  }

  private prepareNext(dir: number): number {
    const target = this.wrap(this.current + dir);
    const u = this.program.uniforms;
    u.tCurrent.value = this.textures[this.current];
    u.uCurrentSize.value = this.sizes[this.current];
    u.tNext.value = this.textures[target];
    u.uNextSize.value = this.sizes[target];
    u.uDir.value = dir;
    return target;
  }

  goTo(dir: number): void {
    if (this.animating || this.dragging || this.items.length < 2) return;
    const opts = this.getOptions();
    if (!opts.loop) {
      const raw = this.current + dir;
      if (raw < 0 || raw > this.items.length - 1) return;
    }
    this.syncOptions();
    const target = this.prepareNext(dir);
    this.animating = true;
    this.announce(target);
    const duration = this.reducedMotion
      ? Math.min(opts.duration, 0.4)
      : opts.duration;
    this.progress = 0;
    this.startTween(1, duration, opts.ease, () => this.commit(target));
  }

  private announce(index: number): void {
    if (index === this.shownIndex) return;
    this.shownIndex = index;
    this.onIndexChange(index);
  }

  private commit(target: number): void {
    this.current = target;
    const u = this.program.uniforms;
    u.tCurrent.value = this.textures[target];
    u.uCurrentSize.value = this.sizes[target];
    this.progress = 0;
    u.uProgress.value = 0;
    this.animating = false;
    this.announce(target);
  }

  next(): void {
    this.goTo(1);
  }

  prev(): void {
    this.goTo(-1);
  }

  setPointer(x: number, y: number): void {
    this.program.uniforms.uPointer.value = [x, y];
  }

  beginDrag(): boolean {
    if (this.animating || this.items.length < 2) return false;
    this.dragging = true;
    this.dragDir = 0;
    this.syncOptions();
    return true;
  }

  drag(ndx: number): void {
    if (!this.dragging) return;
    const opts = this.getOptions();
    const dir = ndx < 0 ? 1 : -1;
    if (!opts.loop) {
      const raw = this.current + dir;
      if (raw < 0 || raw > this.items.length - 1) {
        this.progress = 0;
        return;
      }
    }
    if (dir !== this.dragDir) {
      this.dragDir = dir;
      this.prepareNext(dir);
    }
    this.progress = Math.min(Math.abs(ndx), 1);
    this.announce(
      this.progress > 0.5 ? this.wrap(this.current + dir) : this.current,
    );
  }

  endDrag(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.dragDir === 0) return;
    const target = this.wrap(this.current + this.dragDir);
    const duration = this.reducedMotion ? 0.3 : 0.5;
    this.animating = true;
    if (this.progress > 0.4) {
      this.announce(target);
      this.startTween(1, duration, 'power2.out', () => this.commit(target));
    } else {
      this.announce(this.current);
      this.startTween(0, duration, 'power2.out', () => {
        this.animating = false;
      });
    }
  }

  private onContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.running = false;
  };

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.tween = null;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    for (const img of this.images) {
      img.onload = null;
    }
    this.images = [];
    for (const tex of this.textures) {
      if (tex?.texture) this.gl.deleteTexture(tex.texture);
    }
    this.mesh.geometry.remove();
    this.program.remove();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}
