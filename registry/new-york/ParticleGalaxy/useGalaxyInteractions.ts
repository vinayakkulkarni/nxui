interface InteractionState {
  mouse: { x: number; y: number };
  isDragging: boolean;
  previousMouse: { x: number; y: number };
  targetRotation: { x: number; y: number };
  currentRotation: { x: number; y: number };
  currentTilt: { x: number; y: number };
  targetZoom: number;
  currentZoom: number;
}

interface InteractionOptions {
  enableDrag: boolean;
  enableZoom: boolean;
  enableTouch: boolean;
  minZoom: number;
  maxZoom: number;
}

export function useGalaxyInteractions(
  el: HTMLElement,
  state: InteractionState,
  options: InteractionOptions,
): () => void {
  let touchStartDistance = 0;
  let touchStartZoom = 3;

  const onMouseMove = (e: MouseEvent) => {
    if (state.isDragging) return;
    const r = el.getBoundingClientRect();
    state.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const onMouseLeave = () => {
    if (!state.isDragging) {
      state.mouse.x = 0;
      state.mouse.y = 0;
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (!options.enableDrag) return;
    state.isDragging = true;
    state.previousMouse.x = e.clientX;
    state.previousMouse.y = e.clientY;
    el.style.cursor = 'grabbing';
  };

  const onMouseMoveGlobal = (e: MouseEvent) => {
    if (!state.isDragging || !options.enableDrag) return;
    state.targetRotation.y += (e.clientX - state.previousMouse.x) * 0.005;
    state.targetRotation.x += (e.clientY - state.previousMouse.y) * 0.005;
    state.targetRotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, state.targetRotation.x),
    );
    state.previousMouse.x = e.clientX;
    state.previousMouse.y = e.clientY;
  };

  const onMouseUp = () => {
    if (!options.enableDrag) return;
    state.isDragging = false;
    el.style.cursor = options.enableDrag ? 'grab' : 'default';
  };

  const onWheel = (e: WheelEvent) => {
    if (!options.enableZoom) return;
    e.preventDefault();
    state.targetZoom += e.deltaY * 0.001;
    state.targetZoom = Math.max(
      options.minZoom,
      Math.min(options.maxZoom, state.targetZoom),
    );
  };

  const getTouchDist = (ts: TouchList) => {
    if (ts.length < 2) return 0;
    const dx = ts[0]!.clientX - ts[1]!.clientX;
    const dy = ts[0]!.clientY - ts[1]!.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: TouchEvent) => {
    if (!options.enableTouch) return;
    if (e.touches.length === 2) {
      touchStartDistance = getTouchDist(e.touches);
      touchStartZoom = state.targetZoom;
    } else if (e.touches.length === 1 && options.enableDrag) {
      state.isDragging = true;
      state.previousMouse.x = e.touches[0]!.clientX;
      state.previousMouse.y = e.touches[0]!.clientY;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!options.enableTouch) return;
    if (e.touches.length === 2 && options.enableZoom) {
      e.preventDefault();
      const d = getTouchDist(e.touches);
      state.targetZoom = Math.max(
        options.minZoom,
        Math.min(options.maxZoom, touchStartZoom * (touchStartDistance / d)),
      );
    } else if (
      e.touches.length === 1 &&
      state.isDragging &&
      options.enableDrag
    ) {
      state.targetRotation.y +=
        (e.touches[0]!.clientX - state.previousMouse.x) * 0.005;
      state.targetRotation.x +=
        (e.touches[0]!.clientY - state.previousMouse.y) * 0.005;
      state.targetRotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, state.targetRotation.x),
      );
      state.previousMouse.x = e.touches[0]!.clientX;
      state.previousMouse.y = e.touches[0]!.clientY;
    }
  };

  const onTouchEnd = () => {
    if (options.enableTouch) {
      state.isDragging = false;
      touchStartDistance = 0;
    }
  };

  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseleave', onMouseLeave);
  el.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMoveGlobal);
  document.addEventListener('mouseup', onMouseUp);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('touchstart', onTouchStart, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd);
  el.style.cursor = options.enableDrag ? 'grab' : 'default';

  return () => {
    el.removeEventListener('mousemove', onMouseMove);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMoveGlobal);
    document.removeEventListener('mouseup', onMouseUp);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  };
}
