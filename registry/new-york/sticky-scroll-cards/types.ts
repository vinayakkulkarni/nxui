export interface StickyScrollCardItem {
  title: string;
  src: string;
}

export interface StickyScrollCardsProps {
  cards?: StickyScrollCardItem[];
  hint?: string;
  class?: string;
}
