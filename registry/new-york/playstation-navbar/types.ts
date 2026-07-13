export interface PlaystationNavbarItem {
  id: string;
  label: string;
  /** Secondary line shown while this item is selected. */
  description?: string;
  /** Iconify icon name shown in the rail and inside the cursor pill. */
  icon: string;
}

export interface PlaystationNavbarCategory {
  id: string;
  label: string;
  /** Iconify icon name for the horizontal category rail. */
  icon: string;
  items: PlaystationNavbarItem[];
}

export interface PlaystationNavbarProps {
  categories: PlaystationNavbarCategory[];
  class?: string;
}
