/** Any object type, including interfaces (which have no index signature). */
export type DataTableRow = object;

export type DataTableAriaSort = 'ascending' | 'descending' | 'none';

export interface DataTableColumn<TRow extends DataTableRow = DataTableRow> {
  /** Row field shown in this column; also names the `#cell-<key>` slot. */
  key: Extract<keyof TRow, string>;
  header: string;
  align?: 'start' | 'end';
  sortable?: boolean;
  /** Formats the raw value when no `#cell-<key>` slot is given. */
  format?: (value: TRow[Extract<keyof TRow, string>], row: TRow) => string;
}

export interface DataTableProps<TRow extends DataTableRow = DataTableRow> {
  columns: DataTableColumn<TRow>[];
  data: TRow[];
  /** Field that uniquely identifies a row; used to detect changed rows. */
  rowKey: Extract<keyof TRow, string>;
  /** Shows a search input that filters across every column. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Briefly highlights rows whose values change. */
  flashChanges?: boolean;
  emptyText?: string;
  caption?: string;
  class?: string;
}
