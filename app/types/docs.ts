export interface NavItem {
  title: string;
  path: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
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
