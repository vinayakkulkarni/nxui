export type ModelPickerEffortLevel = 'low' | 'medium' | 'high';

export interface ModelPickerModel {
  /** Unique id, used as the v-model value. */
  id: string;
  /** Name shown in the chip and the menu. */
  name: string;
  /** One-line description under the name. */
  tagline: string;
  /** Letter shown in the icon tile. Defaults to the first letter of the name. */
  glyph?: string;
  /** Iconify name (e.g. `lucide:zap`). Replaces the glyph when set. */
  icon?: string;
  /** Speed rating, 0–5. */
  speed: number;
  /** Quality rating, 0–5. */
  quality: number;
  /** Cost rating, 0–5. */
  cost: number;
  /** Time to first token, in seconds, without extended thinking. */
  latency: number;
  /** Price in dollars per million tokens. */
  price: number;
}

export interface ModelPickerHints {
  auto: string;
  thinkingOn: string;
  thinkingOff: string;
  webOn: string;
  webOff: string;
}

export type ModelPickerEffortScale = Record<ModelPickerEffortLevel, number>;

export interface ModelPickerSubmit {
  prompt: string;
  model: string;
  thinking: boolean;
  effort: ModelPickerEffortLevel;
  webSearch: boolean;
}

export interface ModelPickerProps {
  /** Models listed in the menu. */
  models: ModelPickerModel[];
  /** Adds an "Auto" row that picks a model per message. Its id is `auto`. */
  showAuto?: boolean;
  /** Name of the auto row. */
  autoLabel?: string;
  /** Tagline of the auto row. */
  autoTagline?: string;
  /** Placeholder of the prompt field. */
  placeholder?: string;
  /** Colour of filled bars, checks and switches. */
  accent?: string;
  /** Latency multiplier per effort level when extended thinking is on. */
  effortScale?: ModelPickerEffortScale;
  /** Texts shown in the footer tray. */
  hints?: ModelPickerHints;
  /** Opens the menu and walks through rows on its own until the user interacts. */
  autoplay?: boolean;
  class?: string;
}

export interface ModelPickerRowProps {
  itemKey: string;
  name: string;
  tagline: string;
  glyph?: string;
  icon?: string;
  speed?: number;
  quality?: number;
  cost?: number;
  varies?: boolean;
  checked: boolean;
  active: boolean;
  lit: boolean;
  dimmed: boolean;
  accent: string;
  animate: boolean;
}

export interface ModelPickerBarsProps {
  value: number;
  active: boolean;
  accent: string;
  delay: number;
  animate: boolean;
}

export interface ModelPickerToggleProps {
  itemKey: string;
  label: string;
  icon: string;
  checked: boolean;
  active: boolean;
  accent: string;
}

export interface ModelPickerEffortProps {
  effort: ModelPickerEffortLevel;
  active: boolean;
  label: string;
}

export interface ModelPickerAutoplayOptions {
  /** Turns the walk-through on. */
  enabled: () => boolean;
  /** Element that ends the walk-through when the user touches it. */
  target: () => HTMLElement | null | undefined;
  /** Actions run one per tick, in a loop. */
  steps: () => Array<() => void>;
  /** Milliseconds between steps. */
  interval: number;
  /** Called once when the user takes over. */
  onStop: () => void;
}

export interface ModelPickerTrayProps {
  latency: number;
  price: number;
  hint: string;
  animate: boolean;
}

export interface ModelPickerColumn {
  label: string;
  icon: string;
}
