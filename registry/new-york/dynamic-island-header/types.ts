export interface DynamicIslandLink {
  /** Link label shown in the expanded header. */
  label: string;
  /** Anchor href (e.g. `#pricing`). Used to resolve the active section. */
  href: string;
}

export interface DynamicIslandHeaderProps {
  /** Navigation links shown in the expanded state. */
  links: DynamicIslandLink[];
  /** Scroll offset (px) after which the header collapses into the island. */
  threshold?: number;
  /** Width (px) of the collapsed island pill. */
  compactWidth?: number;
  /** Label shown in the island before any section is reached. */
  defaultLabel?: string;
  /** Sign-in link label. Empty string hides it. */
  signInLabel?: string;
  /** CTA button label. Empty string hides it. */
  ctaLabel?: string;
  /** Scrollable container to track. Defaults to the window. */
  container?: HTMLElement | null;
  class?: string;
}
