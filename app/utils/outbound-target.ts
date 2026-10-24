import type { OutboundTarget } from '~/types/analytics';

/** Maps an outbound URL to the funnel destination it belongs to. */
export function outboundTarget(url: URL): OutboundTarget | null {
  if (url.hostname === 'www.npmjs.com' || url.hostname === 'npmjs.com')
    return 'npm';
  if (url.hostname !== 'github.com') return null;
  return url.pathname.startsWith('/sponsors/') ? 'github_sponsors' : 'github';
}
