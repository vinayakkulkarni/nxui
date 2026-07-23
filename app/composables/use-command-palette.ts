import { useMagicKeys } from '@vueuse/core';

let bound = false;

export function useCommandPalette() {
  // useState is SSR-safe: per-request on the server (no cross-request leaks
  // on Workers isolates), shared client-side singleton after hydration.
  const isOpen = useState('command-palette-open', () => false);

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
