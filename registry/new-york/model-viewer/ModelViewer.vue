<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    DirectionalLight,
    Group,
    MathUtils,
    NeutralToneMapping,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
  } from 'three';
  import { cn } from '~/lib/utils';
  import {
    disposeModel,
    loadEnvironment,
    loadModel,
    measureModel,
  } from './model-viewer-assets';
  import { createContactShadows } from './model-viewer-shadows';
  import type { DataTexture, Object3D } from 'three';
  import type {
    ContactShadows,
    ModelBounds,
    ModelMotion,
    ModelPointer,
    ModelViewerExpose,
    ModelViewerProps,
  } from './types';

  const props = withDefaults(defineProps<ModelViewerProps>(), {
    url: undefined,
    width: 400,
    height: 400,
    environment: 'studio',
    environmentIntensity: 1,
    exposure: 1,
    autoRotate: true,
    autoRotateSpeed: 0.4,
    autoRotateDelay: 2,
    dragRotate: true,
    turntable: false,
    zoom: true,
    minZoom: 0.7,
    maxZoom: 2,
    hoverTilt: 0.15,
    float: 0.3,
    shadow: true,
    shadowOpacity: 0.45,
    intro: 'rise',
    startAngle: -30,
    tilt: 10,
    offsetX: 0,
    offsetY: 0,
    fit: 0.8,
    resetOnDoubleClick: true,
    class: '',
  });

  const emit = defineEmits<{ 'model-loaded': [] }>();

  const FOV = 30;
  const INTRO_SECONDS = 1.3;
  const DRAG_SPEED = 0.0065;
  const PITCH_LIMIT = (65 * Math.PI) / 180;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const container = useTemplateRef<HTMLDivElement>('container');
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  const ready = ref(false);
  const dragging = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  const minZoom = computed(() => Math.min(props.minZoom, props.maxZoom));
  const maxZoom = computed(() => Math.max(props.minZoom, props.maxZoom));
  const toCss = (value: number | string) =>
    typeof value === 'number' ? `${value}px` : value;

  const canvasStyle = computed(() => ({
    touchAction: 'pan-y',
    cursor: dragging.value ? 'grabbing' : props.dragRotate ? 'grab' : 'default',
    opacity: ready.value || props.intro === 'none' ? 1 : 0,
    transition: props.intro === 'none' ? 'none' : 'opacity 0.6s ease',
  }));

  let renderer: WebGLRenderer | null = null;
  let camera: PerspectiveCamera | null = null;
  let scene: Scene | null = null;
  let shadows: ContactShadows | null = null;
  let environmentMap: DataTexture | null = null;
  let model: Object3D | null = null;
  let bounds: ModelBounds | null = null;
  let motion: ModelMotion | null = null;
  let raf = 0;
  let last = 0;
  let visible = true;
  let modelToken = 0;
  let environmentToken = 0;
  const size = { width: 1, height: 1 };
  const place = new Group();
  const floatGroup = new Group();
  const tiltGroup = new Group();
  const spinGroup = new Group();
  const fitGroup = new Group();
  place.add(floatGroup);
  floatGroup.add(tiltGroup);
  tiltGroup.add(spinGroup);
  spinGroup.add(fitGroup);

  const pointers = new Map<number, ModelPointer>();
  let pinchStart = 0;
  let zoomStart = 1;

  function createMotion(): ModelMotion {
    return {
      yaw: toRadians(props.startAngle),
      pitch: toRadians(props.tilt),
      yawVelocity: 0,
      pitchVelocity: 0,
      zoom: 1,
      zoomGoal: 1,
      tiltX: 0,
      tiltY: 0,
      tiltGoalX: 0,
      tiltGoalY: 0,
      spinSpeed: 0,
      idle: 0,
      dragging: false,
      intro: props.intro === 'none' ? 1 : 0,
      clock: 0,
      reset: null,
    };
  }

  function invalidate() {
    if (!raf && renderer) raf = requestAnimationFrame(frame);
  }

  function step(m: ModelMotion, b: ModelBounds, dt: number): boolean {
    const reduce = reducedMotion.value === 'reduce';
    const autoRotateDelay = Math.max(0, props.autoRotateDelay);
    const hoverFloat = Math.max(0, props.float);
    m.clock += dt;
    m.idle += dt;

    if (m.intro < 1) {
      m.intro = reduce ? 1 : Math.min(1, m.intro + dt / INTRO_SECONDS);
    }
    const eased = 1 - Math.pow(1 - m.intro, 3);

    if (m.reset) {
      m.yaw += (m.reset.yaw - m.yaw) * (1 - Math.exp(-dt * 7));
      m.pitch += (m.reset.pitch - m.pitch) * (1 - Math.exp(-dt * 7));
      if (
        Math.abs(m.reset.yaw - m.yaw) < 0.001 &&
        Math.abs(m.reset.pitch - m.pitch) < 0.001
      ) {
        m.reset = null;
      }
    } else if (!m.dragging) {
      const decay = Math.exp(-dt * 4.5);
      m.yaw += m.yawVelocity * dt;
      m.pitch = MathUtils.clamp(
        m.pitch + m.pitchVelocity * dt,
        -PITCH_LIMIT,
        PITCH_LIMIT,
      );
      m.yawVelocity *= decay;
      m.pitchVelocity *= decay;
      if (props.turntable) {
        m.pitch += (toRadians(props.tilt) - m.pitch) * (1 - Math.exp(-dt * 4));
      }
    }

    const spinning =
      props.autoRotate && !reduce && !m.dragging && m.idle > autoRotateDelay;
    m.spinSpeed +=
      ((spinning ? props.autoRotateSpeed : 0) - m.spinSpeed) *
      (1 - Math.exp(-dt * 2));
    m.yaw += m.spinSpeed * dt;

    m.zoom += (m.zoomGoal - m.zoom) * (1 - Math.exp(-dt * 8));
    m.tiltX += (m.tiltGoalX - m.tiltX) * (1 - Math.exp(-dt * 6));
    m.tiltY += (m.tiltGoalY - m.tiltY) * (1 - Math.exp(-dt * 6));

    const aspect = size.width / Math.max(size.height, 1);
    const halfView = Math.tan(toRadians(FOV) / 2);
    const fitDistance =
      b.radius / (Math.max(props.fit, 0.05) * halfView * Math.min(1, aspect));
    const distance = fitDistance / m.zoom;
    if (camera) {
      camera.position.set(0, 0, distance);
      camera.near = distance / 50;
      camera.far = distance * 50;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    const halfHeight = fitDistance * halfView;
    place.position.set(
      props.offsetX * halfHeight * aspect,
      props.offsetY * halfHeight,
      0,
    );

    const intro = props.intro;
    const rise = intro === 'rise' ? (1 - eased) * -0.45 : 0;
    const grow = intro === 'rise' ? 0.9 + 0.1 * eased : 1;
    const twist =
      intro === 'spin'
        ? (1 - eased) * -Math.PI * 1.2
        : intro === 'rise'
          ? (1 - eased) * -0.5
          : 0;
    const bob = reduce ? 0 : Math.sin(m.clock * 1.3) * hoverFloat * 0.06;
    floatGroup.position.y = rise + bob;
    floatGroup.scale.setScalar(grow);
    tiltGroup.rotation.set(m.tiltX, m.tiltY, 0);
    spinGroup.rotation.set(m.pitch, m.yaw + twist, 0, 'YXZ');

    if (shadows) {
      shadows.group.visible = props.shadow;
      shadows.configure({
        y: -b.floor - 0.08,
        opacity: props.shadowOpacity,
        scale: b.radius * 4,
        far: b.floor * 2 + 0.5,
      });
    }

    return (
      m.intro < 1 ||
      m.dragging ||
      !!m.reset ||
      Math.abs(m.yawVelocity) + Math.abs(m.pitchVelocity) > 0.0005 ||
      Math.abs(m.zoomGoal - m.zoom) > 0.0005 ||
      Math.abs(m.tiltGoalX - m.tiltX) + Math.abs(m.tiltGoalY - m.tiltY) >
        0.0005 ||
      m.spinSpeed > 0.0005 ||
      (props.autoRotate && !reduce) ||
      (hoverFloat > 0 && !reduce)
    );
  }

  function frame(now: number) {
    raf = 0;
    if (!renderer || !scene || !camera) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    renderer.toneMappingExposure = props.exposure;
    scene.environmentIntensity = props.environmentIntensity;
    let settling = false;
    if (motion && bounds) {
      settling = step(motion, bounds, dt);
      if (props.shadow && shadows) shadows.render(renderer, scene, 2.6);
    }
    renderer.render(scene, camera);
    if (settling && visible) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  async function setModel(url: string | undefined) {
    const token = ++modelToken;
    ready.value = false;
    if (model) {
      fitGroup.remove(model);
      disposeModel(model);
      model = null;
      bounds = null;
      motion = null;
    }
    invalidate();
    if (!url) return;
    let object: Object3D;
    try {
      object = await loadModel(url);
    } catch {
      return;
    }
    if (token !== modelToken || !renderer) {
      disposeModel(object);
      return;
    }
    model = object;
    bounds = measureModel(object);
    fitGroup.scale.setScalar(bounds.scale);
    fitGroup.position.set(
      -bounds.center.x * bounds.scale,
      -bounds.center.y * bounds.scale,
      -bounds.center.z * bounds.scale,
    );
    fitGroup.add(object);
    motion = createMotion();
    last = 0;
    ready.value = true;
    emit('model-loaded');
    invalidate();
  }

  async function setEnvironment() {
    const token = ++environmentToken;
    const environment = props.environment;
    if (environment === 'none') {
      if (scene) scene.environment = null;
      environmentMap?.dispose();
      environmentMap = null;
      invalidate();
      return;
    }
    let texture: DataTexture;
    try {
      texture = await loadEnvironment(environment);
    } catch {
      return;
    }
    if (token !== environmentToken || !scene) {
      texture.dispose();
      return;
    }
    environmentMap?.dispose();
    environmentMap = texture;
    scene.environment = texture;
    invalidate();
  }

  function resize() {
    const el = container.value;
    if (!el || !renderer || !camera) return;
    size.width = Math.max(1, el.clientWidth);
    size.height = Math.max(1, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    invalidate();
  }

  function onDown(event: PointerEvent) {
    if (!motion) return;
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
    });
    if (pointers.size === 2 && props.zoom) {
      const [a, b] = [...pointers.values()];
      if (a && b) pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      zoomStart = motion.zoomGoal;
      motion.dragging = false;
      dragging.value = false;
    } else if (
      pointers.size === 1 &&
      props.dragRotate &&
      (event.pointerType !== 'mouse' || event.button === 0)
    ) {
      motion.dragging = true;
      motion.yawVelocity = 0;
      motion.pitchVelocity = 0;
      canvas.value?.setPointerCapture?.(event.pointerId);
      dragging.value = true;
    }
    motion.idle = 0;
    invalidate();
  }

  function onMove(event: PointerEvent) {
    const m = motion;
    const el = canvas.value;
    if (!m || !el) return;
    const rect = el.getBoundingClientRect();
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      const hoverTilt = Math.max(0, props.hoverTilt);
      m.tiltGoalX = ny * hoverTilt * 0.6;
      m.tiltGoalY = nx * hoverTilt;
    }
    const lastPointer = pointers.get(event.pointerId);
    if (lastPointer) {
      const dx = event.clientX - lastPointer.x;
      const dy = event.clientY - lastPointer.y;
      const elapsed = Math.max(
        (event.timeStamp - lastPointer.t) / 1000,
        1 / 240,
      );
      lastPointer.x = event.clientX;
      lastPointer.y = event.clientY;
      lastPointer.t = event.timeStamp;
      if (pointers.size === 2 && props.zoom && pinchStart > 0) {
        const [a, b] = [...pointers.values()];
        if (a && b) {
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          m.zoomGoal = MathUtils.clamp(
            (zoomStart * distance) / pinchStart,
            minZoom.value,
            maxZoom.value,
          );
        }
      } else if (m.dragging) {
        m.yaw += dx * DRAG_SPEED;
        m.yawVelocity =
          m.yawVelocity * 0.4 + ((dx * DRAG_SPEED) / elapsed) * 0.6;
        if (!props.turntable) {
          m.pitch = MathUtils.clamp(
            m.pitch + dy * DRAG_SPEED,
            -PITCH_LIMIT,
            PITCH_LIMIT,
          );
          m.pitchVelocity =
            m.pitchVelocity * 0.4 + ((dy * DRAG_SPEED) / elapsed) * 0.6;
        }
        m.idle = 0;
      }
    }
    invalidate();
  }

  function onUp(event: PointerEvent) {
    const lastPointer = pointers.get(event.pointerId);
    if (motion && lastPointer && event.timeStamp - lastPointer.t > 80) {
      motion.yawVelocity = 0;
      motion.pitchVelocity = 0;
    }
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = 0;
    if (pointers.size === 0) {
      if (motion) motion.dragging = false;
      dragging.value = false;
    }
    invalidate();
  }

  function onLeave() {
    if (!motion) return;
    motion.tiltGoalX = 0;
    motion.tiltGoalY = 0;
    invalidate();
  }

  function onWheel(event: WheelEvent) {
    if (!motion || !props.zoom || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    motion.zoomGoal = MathUtils.clamp(
      motion.zoomGoal * Math.exp(-event.deltaY * 0.01),
      minZoom.value,
      maxZoom.value,
    );
    motion.idle = 0;
    invalidate();
  }

  function onDoubleClick() {
    const m = motion;
    if (!m || !props.resetOnDoubleClick) return;
    const start = toRadians(props.startAngle);
    const turns = Math.round((m.yaw - start) / (Math.PI * 2));
    m.reset = {
      yaw: start + turns * Math.PI * 2,
      pitch: toRadians(props.tilt),
    };
    m.zoomGoal = 1;
    m.yawVelocity = 0;
    m.pitchVelocity = 0;
    m.idle = 0;
    invalidate();
  }

  useEventListener(canvas, 'pointerdown', onDown);
  useEventListener(canvas, 'pointermove', onMove);
  useEventListener(canvas, 'pointerup', onUp);
  useEventListener(canvas, 'pointercancel', onUp);
  useEventListener(canvas, 'pointerleave', onLeave);
  useEventListener(canvas, 'wheel', onWheel, { passive: false });
  useEventListener(canvas, 'dblclick', onDoubleClick);
  useResizeObserver(container, resize);
  useIntersectionObserver(container, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      invalidate();
    }
  });

  onMounted(() => {
    if (!canvas.value) return;
    renderer = new WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = props.exposure;
    scene = new Scene();
    camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
    camera.position.set(0, 0, 6);
    const light = new DirectionalLight(0xffffff, 0.6);
    light.position.set(3, 5, 4);
    scene.add(light);
    shadows = createContactShadows();
    place.add(shadows.group);
    scene.add(place);
    resize();
    setEnvironment();
    setModel(props.url);
  });

  watch(() => props.url, setModel);
  watch(() => props.environment, setEnvironment);
  watch(props, invalidate);

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    raf = 0;
    modelToken++;
    environmentToken++;
    if (model) disposeModel(model);
    model = null;
    environmentMap?.dispose();
    shadows?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer = null;
    scene = null;
    camera = null;
  });

  defineExpose<ModelViewerExpose>({
    capture: (type = 'image/png') =>
      renderer ? renderer.domElement.toDataURL(type) : null,
  });
</script>

<template>
  <div
    ref="container"
    :class="cn('relative', props.class)"
    :style="{ width: toCss(width), height: toCss(height) }"
  >
    <canvas
      ref="canvas"
      class="block size-full"
      :style="canvasStyle"
      role="img"
      aria-label="3D model viewer. Drag to rotate, double-click to reset."
    />
  </div>
</template>
