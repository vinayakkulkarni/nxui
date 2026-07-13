export interface NotificationCenterItem {
  id: number | string;
  title: string;
  message: string;
  /** Emoji rendered in the row's icon square. */
  icon?: string;
  /** Epoch ms; rendered as a live-updating relative time. */
  timestamp: number;
  unread?: boolean;
}

export interface NotificationCenterProps {
  /** Panel heading. */
  label?: string;
  /** Horizontal side the panel grows from, relative to the bell. */
  align?: 'left' | 'right';
  class?: string;
}
