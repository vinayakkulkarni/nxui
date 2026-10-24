import type { GtagHandle } from '~/types/analytics';
import { isAutomationBrowser } from '~/utils/automation-browser';

function loadGoogleAnalytics(id: string): GtagHandle {
  // The default trigger (onNuxtReady) waits for requestIdleCallback. The
  // animated demo pages keep the main thread busy, so that callback never
  // ran in a 5s test and gtag.js never loaded. 'client' loads it at once,
  // the same as the Plausible script.
  const { proxy } = useScriptGoogleAnalytics({
    id,
    scriptOptions: { trigger: 'client' },
  });
  return {
    gtag: (...args: unknown[]) => {
      Reflect.apply(proxy.gtag, undefined, args);
    },
  };
}

export default defineNuxtPlugin(() => {
  const gtagId = useRuntimeConfig().public.gtagId;

  // Automation browsers get no analytics. See utils/automation-browser.ts.
  const ga: GtagHandle | undefined =
    gtagId && !isAutomationBrowser() ? loadGoogleAnalytics(gtagId) : undefined;

  return { provide: { ga } };
});
