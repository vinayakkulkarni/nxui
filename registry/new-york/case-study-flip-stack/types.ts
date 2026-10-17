export interface CaseStudyFlipItem {
  number?: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  background: string;
  foreground?: string;
}

export interface CaseStudyFlipStackProps {
  items?: CaseStudyFlipItem[];
  hint?: string;
  heading?: string;
  endLabel?: string;
  class?: string;
}

export interface CaseStudyFlipStackCardProps {
  item: CaseStudyFlipItem;
  index: number;
  total: number;
  progress: number;
  reduceMotion: boolean;
}

export interface CaseStudyFlipFrame {
  transform: string;
  opacity: number;
  innerTransform: string;
}
