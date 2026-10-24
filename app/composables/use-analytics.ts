import type {
  AnalyticsEvent,
  AnalyticsEventPropertiesMap,
  AnalyticsHandles,
} from '~/types/analytics';

/**
 * One typed entry point for product analytics. Each track() call goes to
 * Plausible, OpenPanel and GA4. A tracker that is not loaded (automation
 * browser, SSR, missing ID) is skipped.
 */
export function useAnalytics() {
  const nuxtApp = useNuxtApp();
  const handles: AnalyticsHandles = {
    ga: nuxtApp.$ga,
    plausible: nuxtApp.$plausible,
    openpanel: nuxtApp.$openpanel,
  };

  function track<E extends AnalyticsEvent>(
    event: E,
    properties: AnalyticsEventPropertiesMap[E],
  ) {
    const props: Record<string, unknown> = { ...properties };
    handles.ga?.gtag('event', event, props);
    handles.plausible?.plausible(event, { props });
    handles.openpanel?.track(event, props);
  }

  function identify(userId: string, traits: Record<string, unknown> = {}) {
    handles.ga?.gtag('set', 'user_properties', { user_id: userId, ...traits });
    handles.openpanel?.identify({ profileId: userId, properties: traits });
  }

  return { track, identify };
}
