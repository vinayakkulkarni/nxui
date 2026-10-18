export interface NodeCanvasPoint {
  x: number;
  y: number;
}

/** Corner a resize handle sits on. */
export type NodeCanvasCorner = 'nw' | 'ne' | 'sw' | 'se';

export type NodeCanvasSide = 'left' | 'right' | 'top' | 'bottom';

export interface NodeCanvasAnchor {
  side: NodeCanvasSide;
  /** Position along the side, from 0 (start) to 1 (end). Defaults to `0.5`. */
  offset?: number;
}

export interface NodeCanvasNode {
  /** Unique id. Also names the `#node-<id>` slot. */
  id: string;
  /** Accessible name of the node. */
  label: string;
  /** Left edge in canvas units. */
  x: number;
  /** Top edge in canvas units. */
  y: number;
  width: number;
  height: number;
  /** Tilt in degrees, e.g. `3` for a sticky note. */
  rotate?: number;
  /** Corner radius in canvas units, used by the selection outline. Defaults to `24`. */
  radius?: number;
  /** Fill of the node in the minimap. Defaults to a neutral grey. */
  minimapColor?: string;
  /** Set `false` to keep the node from being dragged or selected. */
  interactive?: boolean;
  /** Keeps the node selectable but stops dragging and resizing. */
  locked?: boolean;
  /** Set `false` to hide the resize handles. Defaults to `true`. */
  resizable?: boolean;
  /** Smallest width a resize can reach, in canvas units. Defaults to `80`. */
  minWidth?: number;
  /** Smallest height a resize can reach, in canvas units. Defaults to `48`. */
  minHeight?: number;
}

export type NodeCanvasEdgeVariant = 'solid' | 'dashed';

export interface NodeCanvasEdge {
  id: string;
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  fromAnchor?: NodeCanvasAnchor;
  toAnchor?: NodeCanvasAnchor;
  /** `solid` draws an accent line, `dashed` a muted dashed line. */
  variant?: NodeCanvasEdgeVariant;
  /** Draws an arrowhead at the target end. */
  arrow?: boolean;
}

export interface NodeCanvasProps {
  nodes: NodeCanvasNode[];
  edges?: NodeCanvasEdge[];
  /** Breadcrumb in the header, e.g. `['Plant North', 'Line 3 Health']`. */
  breadcrumb?: string[];
  /** Grid cell size in canvas units. */
  gridSize?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Amount each zoom button press changes the zoom. */
  zoomStep?: number;
  /** Shows the minimap in the top-right corner. */
  minimap?: boolean;
  /** Accessible name of the canvas region. */
  ariaLabel?: string;
  class?: string;
}

export interface NodeCanvasNodeSlotProps {
  node: NodeCanvasNode;
  selected: boolean;
}

export interface NodeCanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeCanvasMinimapItem extends NodeCanvasRect {
  id: string;
  color: string;
}

export interface NodeCanvasEdgePath {
  id: string;
  d: string;
  variant: NodeCanvasEdgeVariant;
  arrow: boolean;
  end: NodeCanvasPoint;
  start: NodeCanvasPoint;
}

export interface NodeCanvasFrameProps {
  node: NodeCanvasNode;
  /** Current geometry, which may differ from the node's own after a drag or resize. */
  rect: NodeCanvasRect;
  selected: boolean;
  zoom: number;
}

export interface NodeCanvasEdgesProps {
  paths: NodeCanvasEdgePath[];
}

export interface NodeCanvasMinimapProps {
  items: NodeCanvasMinimapItem[];
  viewport: NodeCanvasRect;
}

export interface NodeCanvasZoomProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface NodeCanvasSourceProps {
  label: string;
  /** Lucide icon name. Defaults to `lucide:box`. */
  icon?: string;
  class?: string;
}

export interface NodeCanvasNoteProps {
  /** Lets the user type into the note. Bind the text with `v-model:text`. */
  editable?: boolean;
  /** Focuses the text field when the note mounts, e.g. right after it is placed. */
  autofocus?: boolean;
  placeholder?: string;
  class?: string;
}

export interface NodeCanvasCardProps {
  title: string;
  /** Optional Lucide icon before the title. */
  icon?: string;
  /** Tailwind text color class for the icon. */
  iconClass?: string;
  class?: string;
}

export interface NodeCanvasBarSegment {
  value: number;
  /** CSS color of the segment. */
  color: string;
}

export interface NodeCanvasBarsProps {
  /** One entry per bar; each bar stacks its segments bottom to top. */
  bars: NodeCanvasBarSegment[][];
  /** Accessible summary of the chart. */
  label: string;
  class?: string;
}

export interface NodeCanvasChecklistRow {
  id: string;
  label: string;
  value: number;
  checked?: boolean;
}

export type NodeCanvasSortDirection = 'desc' | 'asc';

export interface NodeCanvasChecklistProps {
  rows: NodeCanvasChecklistRow[];
  /** First column heading. */
  labelHeader?: string;
  /** Chip next to the first heading, e.g. `Shift`. Hidden when empty. */
  chip?: string;
  /** Value column heading. */
  valueHeader?: string;
  class?: string;
}
