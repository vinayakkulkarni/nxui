export interface PlausibleEventPayload {
  domain: string;
  name: string;
  url: string;
  referrer?: string;
  props?: Record<string, string | number | boolean>;
}

export interface PlausibleTrackOptions {
  eventName: string;
  url: string;
  props?: Record<string, string | number | boolean>;
}
