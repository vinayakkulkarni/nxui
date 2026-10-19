import { ref, watch, onBeforeUnmount, computed } from 'vue';
import type { Ref } from 'vue';

// Browsers cap live WebGL contexts at about 16 per page, and many demos are
// WebGL. Only a few tiles may run their real demo at once; the rest wait
// until a visible slot frees up. Client-only state: tiles mount in ClientOnly.
const MAX_LIVE = 12;
const live = ref<string[]>([]);
const waiting = ref<string[]>([]);

function release(id: string): void {
  live.value = live.value.filter((x) => x !== id);
  waiting.value = waiting.value.filter((x) => x !== id);
  const next = waiting.value[0];
  if (next && live.value.length < MAX_LIVE) {
    waiting.value = waiting.value.slice(1);
    live.value = [...live.value, next];
  }
}

function request(id: string): void {
  if (live.value.includes(id) || waiting.value.includes(id)) return;
  if (live.value.length < MAX_LIVE) live.value = [...live.value, id];
  else waiting.value = [...waiting.value, id];
}

/** `true` while this tile holds one of the live demo slots. */
export function useLiveTile(id: string, visible: Ref<boolean>): Ref<boolean> {
  watch(visible, (isVisible) => (isVisible ? request(id) : release(id)), {
    immediate: true,
  });
  onBeforeUnmount(() => release(id));
  return computed(() => live.value.includes(id));
}
