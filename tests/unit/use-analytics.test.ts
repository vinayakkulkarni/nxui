import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnalytics } from '~/composables/use-analytics';

function stubHandles() {
  const handles = {
    $ga: { gtag: vi.fn() },
    $plausible: { plausible: vi.fn() },
    $openpanel: { track: vi.fn(), identify: vi.fn() },
  };
  // useNuxtApp is a Nuxt auto-import, so in plain Vitest it is a global.
  vi.stubGlobal('useNuxtApp', () => handles);
  return handles;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAnalytics', () => {
  it('sends one track() call to Plausible, OpenPanel and GA4', () => {
    const { $ga, $plausible, $openpanel } = stubHandles();
    const props = {
      component: 'shimmer-button',
      location: 'component_page',
      packageManager: 'pnpm',
    } as const;

    useAnalytics().track('install_command_copied', props);

    expect($ga.gtag).toHaveBeenCalledOnce();
    expect($ga.gtag).toHaveBeenCalledWith(
      'event',
      'install_command_copied',
      props,
    );
    expect($plausible.plausible).toHaveBeenCalledOnce();
    expect($plausible.plausible).toHaveBeenCalledWith(
      'install_command_copied',
      { props },
    );
    expect($openpanel.track).toHaveBeenCalledOnce();
    expect($openpanel.track).toHaveBeenCalledWith(
      'install_command_copied',
      props,
    );
  });

  it('skips trackers that are not loaded', () => {
    vi.stubGlobal('useNuxtApp', () => ({}));

    expect(() =>
      useAnalytics().track('component_viewed', {
        component: 'shimmer-button',
        category: 'buttons',
      }),
    ).not.toThrow();
  });

  it('identifies the user in GA4 and OpenPanel', () => {
    const { $ga, $openpanel } = stubHandles();

    useAnalytics().identify('user-1', { plan: 'free' });

    expect($ga.gtag).toHaveBeenCalledWith('set', 'user_properties', {
      user_id: 'user-1',
      plan: 'free',
    });
    expect($openpanel.identify).toHaveBeenCalledWith({
      profileId: 'user-1',
      properties: { plan: 'free' },
    });
  });
});
