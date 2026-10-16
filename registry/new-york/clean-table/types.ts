/** Any object type, including interfaces (which have no index signature). */
export type CleanTableRow = object;

export type CleanTableAriaSort = 'ascending' | 'descending' | 'none';

export type CleanTableStatusKind = 'progress' | 'complete' | 'error';

export interface CleanTableColumn<TRow extends CleanTableRow = CleanTableRow> {
  /** Row field shown in this column; also names the `#cell-<key>` slot. */
  key: Extract<keyof TRow, string>;
  header: string;
  align?: 'start' | 'center' | 'end';
  /** Renders the value in the monospace face, as the reference does for dates and counts. */
  mono?: boolean;
  /** Fades the value to the muted color. */
  muted?: boolean;
  sortable?: boolean;
  /** Tailwind width class for the column, e.g. `w-40`. Long text truncates. */
  width?: string;
}

export interface CleanTableTab {
  value: string;
  label: string;
}

export interface CleanTableProps<TRow extends CleanTableRow = CleanTableRow> {
  columns: CleanTableColumn<TRow>[];
  data: TRow[];
  /** Field that uniquely identifies a row. */
  rowKey: Extract<keyof TRow, string>;
  /** Segmented tabs above the table. Bind the active one with `v-model:tab`. */
  tabs?: CleanTableTab[];
  pageSize?: number;
  /** Total record count for the footer, e.g. from a server. Defaults to the filtered row count. */
  total?: number;
  searchPlaceholder?: string;
  /**
   * Key that focuses the search field. `mod+k` means ⌘K on macOS and Ctrl+K
   * elsewhere; a single key such as `/` works when no field has focus. Pass an
   * empty string to turn it off.
   */
  shortcut?: string;
  emptyText?: string;
  caption?: string;
  class?: string;
}

export interface CleanTableStatusProps {
  status: CleanTableStatusKind;
  label?: string;
}
