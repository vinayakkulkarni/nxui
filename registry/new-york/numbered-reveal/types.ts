export interface RevealSection {
  /** Section number, e.g. '01'. */
  number: string;
  /** Section heading. */
  title: string;
  /** Body copy. */
  body: string;
}

export interface NumberedRevealProps {
  sections?: RevealSection[];
  /** Sections reveal one at a time on scroll (default), or all at once. */
  stagger?: boolean;
  class?: string;
}
