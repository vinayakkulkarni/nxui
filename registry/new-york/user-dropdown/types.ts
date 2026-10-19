export type UserDropdownBadgeTone = 'success' | 'accent' | 'neutral';

export type UserDropdownItemKind = 'item' | 'switch' | 'submenu';

export type UserDropdownSide = 'left' | 'right';

export interface UserDropdownUser {
  /** Display name shown in the trigger. */
  name: string;
  /** Secondary line under the name, usually the email. */
  email?: string;
  /** Avatar image URL. */
  avatar?: string;
  /** Initials shown when there is no image. Defaults to the name's initials. */
  initials?: string;
  /** CSS background for the avatar when there is no image, e.g. a gradient. */
  avatarBackground?: string;
  /** Small pill next to the name, e.g. `Online` or `Pro`. */
  badge?: string;
  /** Colour of the pill. */
  badgeTone?: UserDropdownBadgeTone;
}

export interface UserDropdownSubItem {
  id: string;
  label: string;
  /** Iconify name, e.g. `lucide:plus`. */
  icon?: string;
  /** Avatar image URL drawn instead of the icon. */
  avatar?: string;
  /** CSS background drawn as a round (or square) swatch instead of the icon. */
  avatarBackground?: string;
  /** Draw the swatch as a rounded square (spaces) instead of a circle. */
  square?: boolean;
  /** Shortcut hint, e.g. `⌘1`. Display only. */
  shortcut?: string;
  /** Set to make the row a radio item (`true` = selected). */
  checked?: boolean;
  /** Draws the row as a bordered action, e.g. “Add new account”. */
  action?: boolean;
  disabled?: boolean;
}

export interface UserDropdownItem {
  id: string;
  label: string;
  /** Iconify name, e.g. `lucide:settings`. */
  icon?: string;
  /** Extra classes for the icon, e.g. a colour. */
  iconClass?: string;
  /** `item` (default), `switch` (checkbox with a toggle) or `submenu`. */
  kind?: UserDropdownItemKind;
  /** Single-key shortcut. Shown as a key cap and pressing it while open activates the row. */
  shortcut?: string;
  /** Pill on the right, e.g. `20% off`. */
  badge?: string;
  badgeTone?: UserDropdownBadgeTone;
  /** CSS background drawn as a small square swatch on the right. */
  swatch?: string;
  /** Renders the row as a link. */
  href?: string;
  /** Opens the link in a new tab and shows an external-link icon. */
  external?: boolean;
  /** Red text for destructive actions. */
  danger?: boolean;
  /** Muted text, e.g. a status line. */
  muted?: boolean;
  disabled?: boolean;
  /** Switch state for `kind: 'switch'`. */
  checked?: boolean;
  /** Rows of the submenu for `kind: 'submenu'`. */
  children?: UserDropdownSubItem[];
  /** Small heading at the top of the submenu. */
  submenuTitle?: string;
  /** Which side the submenu opens on. Flips when there is no room. */
  submenuSide?: UserDropdownSide;
  /** Adds a text field to the submenu with this placeholder. Enter emits `submit`. */
  submenuInput?: string;
}

export interface UserDropdownSection {
  id: string;
  items: UserDropdownItem[];
  /** Draws the section on the recessed base under the card. */
  footer?: boolean;
}

export interface UserDropdownProps {
  user: UserDropdownUser;
  sections: UserDropdownSection[];
  /** `v-model:open`. */
  open?: boolean;
  /** Close the menu after a plain item is chosen. */
  closeOnSelect?: boolean;
  /** Colour of the focus ring. */
  accent?: string;
  /** Accessible label for the trigger. Defaults to “Account menu for <name>”. */
  label?: string;
  class?: string;
}

export interface UserDropdownEmits {
  (e: 'update:open', value: boolean): void;
  (e: 'select', item: UserDropdownItem, child?: UserDropdownSubItem): void;
  (e: 'toggle', item: UserDropdownItem, value: boolean): void;
  (e: 'submit', item: UserDropdownItem, value: string): void;
}

/** Flat entry used for roving focus inside the main menu. */
export interface UserDropdownEntry {
  item: UserDropdownItem;
  index: number;
}

export interface UserDropdownSubmenuPosition {
  side: UserDropdownSide | 'inside';
  /** Offset from the top of the menu; used when the row sits in the upper half. */
  top?: number;
  /** Offset from the bottom of the menu; used when the row sits in the lower half. */
  bottom?: number;
}

export type UserDropdownNavMode = 'keyboard' | 'pointer';

export interface UserDropdownAvatarProps {
  src?: string;
  background?: string;
  initials?: string;
  square?: boolean;
  class?: string;
}

export interface UserDropdownRowProps {
  item: UserDropdownItem;
  active?: boolean;
  keyboard?: boolean;
  expanded?: boolean;
  submenuId?: string;
}

export interface UserDropdownSubmenuProps {
  item: UserDropdownItem;
  activeIndex: number;
  keyboard: boolean;
  position: UserDropdownSubmenuPosition;
  menuId: string;
}

export interface UserDropdownSubmenuEmits {
  activate: [index: number];
  hover: [index: number];
  keydown: [event: KeyboardEvent];
  submit: [value: string];
  pointerenter: [];
}

export interface UserDropdownRowEmits {
  activate: [];
  hover: [];
}
