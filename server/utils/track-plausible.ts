import type { H3Event } from 'h3';
import { getRequestHeader, getRequestIP } from 'h3';
import type {
  PlausibleEventPayload,
  PlausibleTrackOptions,
} from '~/types/plausible';

/** Plausible Events API — server-side, since module composables are client-only. */
export async function trackPlausibleEvent(
  event: H3Event,
  options: PlausibleTrackOptions,
): Promise<void> {
  const config = useRuntimeConfig(event);
  const plausible = config.public.plausible as {
    apiHost?: string;
    domain?: string;
  };

  if (!plausible?.apiHost || !plausible?.domain) {
    return;
  }

  const clientIP =
    getRequestHeader(event, 'cf-connecting-ip') ??
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    getRequestIP(event);

  const userAgent = getRequestHeader(event, 'user-agent') ?? '';

  const payload: PlausibleEventPayload = {
    domain: plausible.domain,
    name: options.eventName,
    url: options.url,
    props: options.props,
  };

  await $fetch(`${plausible.apiHost}/api/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      ...(clientIP ? { 'X-Forwarded-For': clientIP } : {}),
    },
    body: payload,
  });
}
