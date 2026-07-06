import { useMagicKeys } from '@vueuse/core';

const isOpen = ref(false);
let bound = false;

export function useCommandPalette() {
  // Register the ⌘K / Ctrl+K / Escape listeners exactly once, no matter how
  // many trigger buttons mount (docs header + component-page toolbar). Mirrors
  // the original single-instance watch semantics so the shortcut toggles once
  // per press rather than firing on every keys-object mutation.
  if (!bound && import.meta.client) {
    bound = true;
    const { meta_k, ctrl_k, escape } = useMagicKeys();

    watch([meta_k, ctrl_k], ([mk, ck]) => {
      if (mk || ck) isOpen.value = !isOpen.value;
    });

    watch(escape!, (val) => {
      if (val) isOpen.value = false;
    });
  }

  return { isOpen };
}
