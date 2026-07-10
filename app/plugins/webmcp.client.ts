import type { WebMcpModelContext, WebMcpTool } from '~/types/webmcp';
import type { RegistryIndex } from '~/types/mcp';

export default defineNuxtPlugin(() => {
  const nav = navigator as Navigator & { modelContext?: WebMcpModelContext };
  const modelContext = nav.modelContext;
  if (!modelContext) return;

  const searchComponents: WebMcpTool = {
    name: 'search_components',
    description:
      'Search the nxui registry of 220+ animated Vue components by name, title, or description. Returns matching components with install commands.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Case-insensitive search query, e.g. "shimmer".',
        },
      },
    },
    execute: async (input) => {
      try {
        const registry = await $fetch<RegistryIndex>('/r/registry.json');
        const query =
          typeof input.query === 'string' ? input.query.toLowerCase() : '';
        return registry.items
          .filter(
            (item) =>
              !query ||
              [item.name, item.title, item.description]
                .join(' ')
                .toLowerCase()
                .includes(query),
          )
          .map((item) => ({
            name: item.name,
            title: item.title,
            description: item.description,
            install: `npx shadcn-vue@latest add https://nxui.geoql.in/r/${item.name}.json`,
          }));
      } catch {
        throw new Error('Component search failed.');
      }
    },
  };

  const getComponent: WebMcpTool = {
    name: 'get_component',
    description:
      'Get full details for one nxui component: description, dependencies, install command, and Vue source files.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name in kebab-case, e.g. "shimmer-button".',
        },
      },
      required: ['name'],
    },
    execute: async (input) => {
      const name = typeof input.name === 'string' ? input.name : '';
      if (!/^[a-z0-9-]+$/.test(name)) {
        throw new Error('Invalid component name.');
      }
      try {
        return await $fetch(`/r/${name}.json`);
      } catch {
        throw new Error(`Component "${name}" not found.`);
      }
    },
  };

  const openComponentDocs: WebMcpTool = {
    name: 'open_component_docs',
    description:
      'Navigate the current page to the documentation of an nxui component category or page path, e.g. "/docs/buttons/shimmer-button".',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Docs path starting with /docs.',
        },
      },
      required: ['path'],
    },
    execute: async (input) => {
      const path = typeof input.path === 'string' ? input.path : '';
      if (!path.startsWith('/docs')) {
        throw new Error('Path must start with /docs.');
      }
      await navigateTo(path);
      return { navigated: path };
    },
  };

  const tools = [searchComponents, getComponent, openComponentDocs];

  if (typeof modelContext.registerTool === 'function') {
    for (const tool of tools) {
      modelContext.registerTool(tool);
    }
  } else if (typeof modelContext.provideContext === 'function') {
    modelContext.provideContext({ tools });
  }
});
