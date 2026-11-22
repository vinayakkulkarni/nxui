import type { LiquidTabsGlyphName, LiquidTabsTab } from './types';

const GLYPHS: readonly LiquidTabsGlyphName[] = [
  'dome',
  'shield-outline',
  'shield-notch',
];

const GLYPH_SET: ReadonlySet<string> = new Set(GLYPHS);

export function isGlyph(icon: string): icon is LiquidTabsGlyphName {
  return GLYPH_SET.has(icon);
}

export const DEFAULT_TABS: LiquidTabsTab[] = [
  {
    key: 'all',
    label: 'All',
    selected: 'a2',
    rows: [
      {
        id: 'a1',
        title: 'All',
        subtitle: 'Notification',
        time: '12:10',
        icon: 'dome',
      },
      {
        id: 'a2',
        title: 'Mentions',
        subtitle: 'Notification',
        time: '13:00',
        icon: 'shield-outline',
      },
      {
        id: 'a3',
        title: 'Badge',
        subtitle: 'Notification',
        time: '13:10',
        icon: 'shield-notch',
      },
      {
        id: 'a4',
        title: 'Security',
        subtitle: 'Notification',
        time: '14:25',
        icon: 'lucide:shield-check',
      },
    ],
  },
  {
    key: 'mentions',
    label: 'Mentions',
    selected: 'm1',
    rows: [
      {
        id: 'm1',
        title: 'Design review',
        subtitle: 'Mentioned you',
        time: '09:42',
        icon: 'lucide:at-sign',
      },
      {
        id: 'm2',
        title: 'Release notes',
        subtitle: 'Replied to you',
        time: '10:15',
        icon: 'lucide:reply',
      },
      {
        id: 'm3',
        title: 'Roadmap',
        subtitle: 'Commented',
        time: '11:30',
        icon: 'lucide:message-circle',
      },
      {
        id: 'm4',
        title: 'Changelog',
        subtitle: 'Quoted you',
        time: '12:05',
        icon: 'lucide:quote',
      },
    ],
  },
];

export const DEFAULT_OVERFLOW: LiquidTabsTab[] = [
  {
    key: 'system',
    label: 'System',
    selected: 's2',
    rows: [
      {
        id: 's1',
        title: 'Update',
        subtitle: 'Version 2.4 ready',
        time: '08:00',
        icon: 'lucide:refresh-cw',
      },
      {
        id: 's2',
        title: 'Security',
        subtitle: 'New sign-in',
        time: '08:45',
        icon: 'lucide:shield-check',
      },
      {
        id: 's3',
        title: 'Storage',
        subtitle: '80% used',
        time: '10:20',
        icon: 'lucide:hard-drive',
      },
      {
        id: 's4',
        title: 'Settings',
        subtitle: 'Preferences saved',
        time: '11:55',
        icon: 'lucide:settings',
      },
    ],
  },
  {
    key: 'archived',
    label: 'Archived',
    selected: 'r1',
    rows: [
      {
        id: 'r1',
        title: 'Inbox',
        subtitle: 'Cleared',
        time: 'Mon',
        icon: 'lucide:inbox',
      },
      {
        id: 'r2',
        title: 'Delivery',
        subtitle: 'Package arrived',
        time: 'Sun',
        icon: 'lucide:package',
      },
      {
        id: 'r3',
        title: 'Reminder',
        subtitle: 'Snoozed',
        time: 'Sat',
        icon: 'lucide:clock',
      },
      {
        id: 'r4',
        title: 'Archive',
        subtitle: '12 items',
        time: 'Fri',
        icon: 'lucide:archive',
      },
    ],
  },
  {
    key: 'requests',
    label: 'Requests',
    selected: 'q1',
    rows: [
      {
        id: 'q1',
        title: 'New member',
        subtitle: 'Wants to connect',
        time: '07:30',
        icon: 'lucide:user-plus',
      },
      {
        id: 'q2',
        title: 'Design Team',
        subtitle: 'Invite to join',
        time: '09:10',
        icon: 'lucide:users',
      },
      {
        id: 'q3',
        title: 'Shared link',
        subtitle: 'Access requested',
        time: '10:40',
        icon: 'lucide:link-2',
      },
      {
        id: 'q4',
        title: 'Newsletter',
        subtitle: 'Confirm email',
        time: '13:20',
        icon: 'lucide:mail',
      },
    ],
  },
];
