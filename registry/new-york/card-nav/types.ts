export interface CardNavLink {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface CardNavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
}
