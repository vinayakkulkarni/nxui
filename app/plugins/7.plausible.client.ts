import type {
  PlausibleFn,
  PlausibleHandle,
  PlausibleInitOptions,
} from '~/types/analytics';
import { isAutomationBrowser } from '~/utils/automation-browser';

function loadPlausible(scriptSrc: string): PlausibleHandle {
  // The pa-*.js tracker boots only when `window.plausible.o` is already set
  // when it loads. So this is Plausible's official snippet: define the queue
  // stub and call init() to set `.o` BEFORE the async script arrives.
  // @nuxtjs/plausible and the @nuxt/scripts Plausible helper never do this.
  const queue: unknown[] = [];
  const stub: PlausibleFn = Object.assign(
    (...args: unknown[]) => {
      queue.push(args);
    },
    {
      q: queue,
      init: (options: PlausibleInitOptions) => {
        stub.o = options;
      },
    },
  );
  window.plausible = stub;
  stub.init({
    autoCapturePageviews: true,
    outboundLinks: true,
    captureOnLocalhost: import.meta.dev,
  });

  useHead({ script: [{ src: scriptSrc, async: true }] });

  return {
    plausible: (...args: unknown[]) => {
      window.plausible(...args);
    },
  };
}

export default defineNuxtPlugin(() => {
  const { plausibleScriptId, plausibleApiHost } = useRuntimeConfig().public;

  // Automation browsers get no analytics. See utils/automation-browser.ts.
  // The check runs before useHead so the script tag is never added for them.
  const enabled =
    Boolean(plausibleScriptId && plausibleApiHost) && !isAutomationBrowser();

  const plausible: PlausibleHandle | undefined = enabled
    ? loadPlausible(`${plausibleApiHost}/js/${plausibleScriptId}.js`)
    : undefined;

  return { provide: { plausible } };
});
