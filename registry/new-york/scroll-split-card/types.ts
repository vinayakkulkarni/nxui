export interface ScrollSplitCardItem {
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

export interface ScrollSplitCardProps {
  imageSrc: string;
  cards: ScrollSplitCardItem[];
  startHint?: string;
  endHint?: string;
  class?: string;
}
