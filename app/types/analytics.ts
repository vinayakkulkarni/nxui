import type { PackageManager } from '~/types/components';

/**
 * Every product event nxui sends. A closed union: one name per funnel step,
 * never a free string. useAnalytics().track() sends each event to Plausible,
 * OpenPanel and GA4.
 */
export type AnalyticsEvent =
  | 'component_viewed'
  | 'install_command_copied'
  | 'source_code_copied'
  | 'outbound_link_clicked'
  | 'search_result_selected';

/** Where on the site an install command was copied. */
export type InstallCommandLocation = 'component_page' | 'gallery_hero';

/** Outbound destinations the funnel cares about. */
export type OutboundTarget = 'github' | 'github_sponsors' | 'npm';

export interface ComponentViewedProperties {
  component: string;
  category: string;
}

export interface InstallCommandCopiedProperties {
  component: string;
  location: InstallCommandLocation;
  packageManager: PackageManager;
}

export interface SourceCodeCopiedProperties {
  file: string;
}

export interface OutboundLinkClickedProperties {
  target: OutboundTarget;
  href: string;
  path: string;
}

/** The query text is never sent, only its length. */
export interface SearchResultSelectedProperties {
  path: string;
  queryLength: number;
}

/** Maps each event to the only property shape it accepts. */
export interface AnalyticsEventPropertiesMap {
  component_viewed: ComponentViewedProperties;
  install_command_copied: InstallCommandCopiedProperties;
  source_code_copied: SourceCodeCopiedProperties;
  outbound_link_clicked: OutboundLinkClickedProperties;
  search_result_selected: SearchResultSelectedProperties;
}

/**
 * plausible.init() options. @nuxt/scripts declares `window.plausible`; its
 * options type omits `outboundLinks`, which the pa-*.js script supports.
 */
export type PlausibleInitOptions = Parameters<
  Window['plausible']['init']
>[0] & {
  outboundLinks?: boolean;
};

/**
 * Shape of the Plausible `pa-*.js` global: callable, plus the loader's
 * bookkeeping. q is the queue before the script loads, o holds the init
 * options the script boots from.
 */
export interface PlausibleFn {
  (...args: unknown[]): void;
  q: unknown[];
  o?: PlausibleInitOptions;
  init: (options: PlausibleInitOptions) => void;
}

/** GA4 gtag handle provided as `$ga`. */
export interface GtagHandle {
  gtag: (...args: unknown[]) => void;
}

/** Plausible handle provided as `$plausible`. */
export interface PlausibleHandle {
  plausible: (...args: unknown[]) => void;
}

/** The part of the OpenPanel web SDK that `$openpanel` must expose. */
export interface OpenPanelHandle {
  track: (name: string, properties?: Record<string, unknown>) => unknown;
  identify: (payload: {
    profileId: string;
    properties?: Record<string, unknown>;
  }) => unknown;
}

// In this repo, Nuxt's generated plugin injection types resolve to unknown
// (even a plugin that returns `{ provide: { probe: 1 } }` gives `$probe:
// unknown` under `nuxt typecheck`). So the handles that
// plugins/5.google-analytics.client.ts and plugins/7.plausible.client.ts
// provide are declared here. Both are undefined on the server and in
// automation browsers.
declare module '#app' {
  interface NuxtApp {
    $ga: GtagHandle | undefined;
    $plausible: PlausibleHandle | undefined;
  }
}

/** The three tracker handles one track() call fans out to. */
export interface AnalyticsHandles {
  ga?: GtagHandle;
  plausible?: PlausibleHandle;
  openpanel?: OpenPanelHandle;
}
