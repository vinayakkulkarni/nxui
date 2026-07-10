import type { H3Event } from 'h3';
import type {
  McpToolDefinition,
  McpToolResult,
  RegistryIndexItem,
} from '~/types/mcp';

const SITE_URL = 'https://nxui.geoql.in';

export const MCP_SERVER_INFO = {
  name: 'nxui',
  title: 'nxui — animated Vue components',
  version: '1.0.0',
} as const;

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_components',
    description:
      'List all nxui components. Optionally filter with a search query matched against name, title, and description. Returns name, title, description, and install command for each match.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional case-insensitive search query (e.g. "shimmer", "background", "text animation").',
        },
      },
    },
  },
  {
    name: 'get_component',
    description:
      'Get full details for one nxui component by name: description, npm dependencies, registry dependencies, install command, docs URL, and complete Vue source files.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name in kebab-case (e.g. "shimmer-button").',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_install_command',
    description:
      'Get the shadcn-vue CLI command that installs an nxui component into a Vue/Nuxt project.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name in kebab-case (e.g. "shimmer-button").',
        },
      },
      required: ['name'],
    },
  },
];

function text(value: string): McpToolResult {
  return { content: [{ type: 'text', text: value }] };
}

function toolError(message: string): McpToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function formatIndexItem(item: RegistryIndexItem): string {
  return [
    `## ${item.title} (\`${item.name}\`)`,
    item.description,
    `Install: \`npx shadcn-vue@latest add ${SITE_URL}/r/${item.name}.json\``,
  ].join('\n');
}

export async function callMcpTool(
  event: H3Event,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  if (name === 'list_components') {
    const query =
      typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
    const items = getRegistryIndex().items.filter((item) => {
      if (!query) return true;
      return [item.name, item.title, item.description]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    if (items.length === 0) {
      return text(`No components match "${query}".`);
    }
    return text(
      [
        `# nxui components (${items.length})`,
        ...items.map(formatIndexItem),
      ].join('\n\n'),
    );
  }

  if (name === 'get_component' || name === 'get_install_command') {
    const componentName = typeof args.name === 'string' ? args.name : '';
    if (!componentName) {
      return toolError('Missing required argument "name".');
    }
    const item = await getRegistryItem(event, componentName);
    if (!item) {
      return toolError(
        `Component "${componentName}" not found. Use list_components to see available components.`,
      );
    }
    const install = `npx shadcn-vue@latest add ${SITE_URL}/r/${item.name}.json`;
    if (name === 'get_install_command') {
      return text(install);
    }
    const sections = [
      `# ${item.title} (\`${item.name}\`)`,
      item.description,
      `Install: \`${install}\``,
      `Docs: ${SITE_URL}/docs (search for "${item.title}")`,
    ];
    if (item.dependencies?.length) {
      sections.push(`npm dependencies: ${item.dependencies.join(', ')}`);
    }
    if (item.registryDependencies?.length) {
      sections.push(
        `Registry dependencies: ${item.registryDependencies.join(', ')}`,
      );
    }
    for (const file of item.files) {
      sections.push(`## ${file.target}\n\n\`\`\`vue\n${file.content}\n\`\`\``);
    }
    return text(sections.join('\n\n'));
  }

  return toolError(`Unknown tool "${name}".`);
}
