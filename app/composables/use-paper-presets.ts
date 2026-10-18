// Preset switcher for the Paper Shaders demos. Mirrors the "Presets" folder on
// shaders.paper.design: picking a preset copies its values onto the demo's
// reactive params. Like upstream's setParamsSafe, only keys the demo exposes
// are copied, so wrapper defaults cover everything else.
import type { FolderApi, Pane } from 'tweakpane';
import type { PaperShaderPreset } from '~/types/paper-presets';

const SHORT_HEX = /^#[\da-f]{6}$/i;

// Tweakpane keeps the color format it first sees. A six-digit start value
// would silently drop the alpha of a later `#rrggbbaa` preset color, so every
// hex color is stored with an explicit alpha channel.
function normalizeColor(value: unknown): unknown {
  return typeof value === 'string' && SHORT_HEX.test(value)
    ? `${value}ff`
    : value;
}

function copyValue(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map(normalizeColor)
    : normalizeColor(value);
}

/** The first preset (upstream's default) reduced to the keys a demo exposes. */
export function pickPaperPreset<P extends object, K extends keyof P>(
  presets: readonly PaperShaderPreset<P>[],
  keys: readonly K[],
): Pick<P, K> {
  const [first] = presets;
  if (!first) throw new Error('pickPaperPreset needs at least one preset');
  const picked: Partial<Pick<P, K>> = {};
  for (const key of keys) {
    Reflect.set(picked, key, copyValue(first.params[key]));
  }
  return { ...first.params, ...picked };
}

export function usePaperPresets(
  params: object,
  presets: readonly PaperShaderPreset<object>[],
) {
  const state = { preset: presets[0]?.name ?? '' };
  const colorFolders: { folder: FolderApi; key: string }[] = [];

  function renderColors(folder: FolderApi, key: string) {
    for (const child of folder.children.slice()) folder.remove(child);
    const colors: unknown = Reflect.get(params, key);
    if (!Array.isArray(colors)) return;
    colors.forEach((_, index) => {
      folder.addBinding(colors, index, { label: `color-${index + 1}` });
    });
  }

  function applyPreset(pane: Pane, name: string) {
    const preset = presets.find((item) => item.name === name);
    if (!preset) return;
    for (const [key, value] of Object.entries(preset.params)) {
      if (key in params) Reflect.set(params, key, copyValue(value));
    }
    for (const { folder, key } of colorFolders) renderColors(folder, key);
    pane.refresh();
  }

  /** Adds the preset select. Call it first so it sits at the top of the pane. */
  function addPresetBinding(pane: Pane) {
    const options = Object.fromEntries(presets.map(({ name }) => [name, name]));
    pane
      .addBinding(state, 'preset', { options })
      .on('change', (event) => applyPreset(pane, event.value));
  }

  /** Adds a folder with one color binding per entry of a color-array param. */
  function addColorsFolder(pane: Pane, key = 'colors') {
    const folder = pane.addFolder({ title: key });
    colorFolders.push({ folder, key });
    renderColors(folder, key);
  }

  return { addPresetBinding, addColorsFolder };
}
