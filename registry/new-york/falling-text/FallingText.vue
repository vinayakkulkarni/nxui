<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
  import Matter from 'matter-js';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text?: string;
      highlightWords?: string[];
      highlightClass?: string;
      trigger?: 'auto' | 'scroll' | 'click' | 'hover';
      backgroundColor?: string;
      wireframes?: boolean;
      gravity?: number;
      mouseConstraintStiffness?: number;
      fontSize?: string;
      class?: string;
    }>(),
    {
      text: '',
      highlightWords: () => [],
      highlightClass: 'highlighted',
      trigger: 'auto',
      backgroundColor: 'transparent',
      wireframes: false,
      gravity: 1,
      mouseConstraintStiffness: 0.2,
      fontSize: '1rem',
      class: '',
    },
  );

  const containerRef = ref<HTMLElement | null>(null);
  const textRef = ref<HTMLElement | null>(null);
  const canvasContainerRef = ref<HTMLElement | null>(null);
  const effectStarted = ref(false);

  let engine: Matter.Engine | null = null;
  let render: Matter.Render | null = null;
  let runner: Matter.Runner | null = null;
  let animFrame: number | null = null;
  let observer: IntersectionObserver | null = null;

  interface WordBody {
    elem: HTMLElement;
    body: Matter.Body;
  }

  let wordBodies: WordBody[] = [];

  function buildTextHTML() {
    if (!textRef.value) return;
    const words = props.text.split(' ');
    const spans = words.map((word) => {
      const isHighlighted = props.highlightWords.some((hw) =>
        word.startsWith(hw),
      );
      const cls = isHighlighted ? `word ${props.highlightClass}` : 'word';
      return `<span class="${cls}">${word}</span>`;
    });
    textRef.value.innerHTML = spans.join(' ');
  }

  function startPhysics() {
    if (!containerRef.value || !textRef.value || !canvasContainerRef.value)
      return;

    const containerRect = containerRef.value.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    if (width <= 0 || height <= 0) return;

    engine = Matter.Engine.create();
    engine.world.gravity.y = props.gravity;

    render = Matter.Render.create({
      element: canvasContainerRef.value,
      engine,
      options: {
        width,
        height,
        background: props.backgroundColor,
        wireframes: props.wireframes,
      },
    });

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: 'transparent' },
    };
    const floor = Matter.Bodies.rectangle(
      width / 2,
      height + 25,
      width,
      50,
      boundaryOptions,
    );
    const leftWall = Matter.Bodies.rectangle(
      -25,
      height / 2,
      50,
      height,
      boundaryOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      width + 25,
      height / 2,
      50,
      height,
      boundaryOptions,
    );
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -25,
      width,
      50,
      boundaryOptions,
    );

    const wordSpans = textRef.value.querySelectorAll('.word');
    wordBodies = [...wordSpans].map((elem) => {
      const el = elem as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: 'transparent' },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2,
      });

      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: 0,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      el.style.position = 'absolute';

      return { elem: el, body };
    });

    const mouse = Matter.Mouse.create(containerRef.value);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: props.mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    render.mouse = mouse;

    Matter.World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    function updateLoop() {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      animFrame = requestAnimationFrame(updateLoop);
    }
    animFrame = requestAnimationFrame(updateLoop);
  }

  function cleanup() {
    if (animFrame !== null) cancelAnimationFrame(animFrame);
    if (render) {
      Matter.Render.stop(render);
      if (render.canvas && canvasContainerRef.value?.contains(render.canvas)) {
        canvasContainerRef.value.removeChild(render.canvas);
      }
    }
    if (runner) Matter.Runner.stop(runner);
    if (engine) {
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    }
    engine = null;
    render = null;
    runner = null;
    wordBodies = [];
    observer?.disconnect();
  }

  watch(effectStarted, (started) => {
    if (started) {
      nextTick(() => startPhysics());
    }
  });

  onMounted(() => {
    buildTextHTML();

    if (props.trigger === 'auto') {
      effectStarted.value = true;
    } else if (props.trigger === 'scroll' && containerRef.value) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            effectStarted.value = true;
            observer?.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(containerRef.value);
    }
  });

  onBeforeUnmount(() => {
    cleanup();
  });

  function handleTrigger() {
    if (
      !effectStarted.value &&
      (props.trigger === 'click' || props.trigger === 'hover')
    ) {
      effectStarted.value = true;
    }
  }
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('falling-text-container', $props.class)"
    @click="trigger === 'click' ? handleTrigger() : undefined"
    @mouseenter="trigger === 'hover' ? handleTrigger() : undefined"
  >
    <div
      ref="textRef"
      class="falling-text-target"
      :style="{ fontSize, lineHeight: 1.4 }"
    ></div>
    <div ref="canvasContainerRef" class="falling-text-canvas"></div>
  </div>
</template>

<style scoped>
  .falling-text-container {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    cursor: pointer;
    text-align: center;
    padding-top: 2em;
    overflow: hidden;
  }

  .falling-text-target {
    display: inline-block;
  }

  .falling-text-target :deep(.word) {
    display: inline-block;
    margin: 0 2px;
    user-select: none;
  }

  .falling-text-target :deep(.highlighted) {
    color: cyan;
    font-weight: bold;
  }

  .falling-text-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>
