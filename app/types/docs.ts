import type { MinimarkNode } from '@nuxt/content';

/** One `## Heading` block of a component page body, rendered as a collapsible section. */
export interface DocsBodySection {
  id: string;
  title: string;
  nodes: MinimarkNode[];
}

export interface DocsPageBodyProps {
  /** Top-level nodes of the page's minimark body. */
  nodes: MinimarkNode[];
}

/** `new`: component added recently. `updated`: rebuilt to match a newer upstream. */
export type NavBadge = 'new' | 'updated';

export interface NavItem {
  title: string;
  path: string;
  badge?: NavBadge;
}

export interface DocsNavBadgeProps {
  badge: NavBadge;
}

export interface DocsSidebarItemProps {
  title: string;
  path: string;
  isActive: boolean;
  badge?: NavBadge;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** One component card in the /docs gallery. */
export interface GalleryItem extends NavItem {
  /** Last path segment, e.g. `paper-crumple`. Also keys the demo module. */
  slug: string;
  /** Docs group title, e.g. `Components`. */
  category: string;
}

export interface GalleryCategory {
  title: string;
  items: GalleryItem[];
}

export interface DocsGalleryTileProps {
  item: GalleryItem;
  /** Bento tiles span more grid cells and use a taller preview. */
  size?: 'sm' | 'lg';
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export interface PropItem {
  name: string;
  type: string;
  default?: string;
  description: string;
}
