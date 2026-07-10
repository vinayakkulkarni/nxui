# Install an nxui component

nxui is a registry of 220+ animated Vue 3 components (Tailwind CSS + motion-v),
including the only Vue port of Paper Shaders. Components are installed with the
shadcn-vue CLI — you copy the source into your project and own the code.

## Install

```bash
npx shadcn-vue@latest add https://nxui.geoql.in/r/<component-name>.json
```

Example:

```bash
npx shadcn-vue@latest add https://nxui.geoql.in/r/shimmer-button.json
```

## Discover component names

- Registry index (JSON): `GET https://nxui.geoql.in/r/registry.json` — 220+
  items with `name`, `title`, `description`.
- Per-component payload: `GET https://nxui.geoql.in/r/<name>.json` — full Vue
  source in `files[].content`, npm deps in `dependencies`.
- Docs: https://nxui.geoql.in/docs (each page is also raw markdown at
  `https://nxui.geoql.in/raw/docs/<category>/<name>.md`).

## Requirements

The target project needs Vue 3 + Tailwind CSS v4, with shadcn-vue initialized
(`npx shadcn-vue@latest init`). Components use TypeScript and `motion-v` where
animation is involved; the CLI installs npm dependencies automatically.
