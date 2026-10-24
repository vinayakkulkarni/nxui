import { useEventListener } from '@vueuse/core';
import { outboundTarget } from '~/utils/outbound-target';

// One delegated listener covers every GitHub and npm link: header, toolbar,
// star button, edit/issue links, error page and links inside markdown docs.
export default defineNuxtPlugin(() => {
  const { track } = useAnalytics();
  const route = useRoute();

  useEventListener(
    document,
    'click',
    (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = outboundTarget(new URL(anchor.href));
      if (!target) return;
      track('outbound_link_clicked', {
        target,
        href: anchor.href,
        path: route.path,
      });
    },
    { capture: true },
  );
});
