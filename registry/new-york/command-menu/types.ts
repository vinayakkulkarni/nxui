export interface CommandItem {
  label: string;
  icon?: string;
  shortcut?: string;
  group?: string;
  onSelect?: () => void;
}

export interface CommandMenuItem {
  id: string;
  title: string;
  icon?: string;
  onSelect?: () => void;
}

export interface CommandMenuGroup {
  title: string;
  items: CommandMenuItem[];
}
