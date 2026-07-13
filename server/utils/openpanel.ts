import type { H3Event } from 'h3';
import { OpenPanel } from '@openpanel/sdk';

/**
 * Server-side OpenPanel tracker. The Nuxt module's SDK is client-only, so
 * server routes talk to the self-hosted instance directly via @openpanel/sdk,
 * authenticated with the private clientSecret. On Cloudflare Workers each
 * request runs in its own isolate, so track calls must be awaited before the
 * response resolves or the event is dropped.
 */
export async function trackOpenPanelEvent(
  event: H3Event,
  name: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const { clientId, clientSecret } = useRuntimeConfig(event).openpanel as {
    clientId?: string;
    clientSecret?: string;
  };

  if (!clientId || !clientSecret) {
    return;
  }

  const op = new OpenPanel({
    clientId,
    clientSecret,
    apiUrl: 'https://events.geoql.in/api',
    sdk: 'node',
  });

  await op.track(name, properties);
}
