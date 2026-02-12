export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface ComponentMeta {
  name: string;
  slug: string;
  title: string;
  description: string;
  category:
    | 'text-animations'
    | 'components'
    | 'hero-backgrounds'
    | 'visual-effects'
    | 'buttons';
  dependencies?: string[];
  registryDependencies?: string[];
}

export interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}
