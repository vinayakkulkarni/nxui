import type {
  A2aAgentCard,
  A2aArtifact,
  A2aMessage,
  A2aTask,
} from '~/types/a2a';
import type { RegistryIndexItem } from '~/types/mcp';

const SITE_URL = 'https://nxui.geoql.in';

export const A2A_AGENT_CARD: A2aAgentCard = {
  name: 'nxui Component Finder',
  description:
    'Deterministic agent for the nxui registry of 220+ animated Vue components. Send a plain-text description of the UI you need (e.g. "shimmering call-to-action button") and it returns matching components with descriptions, docs links, and shadcn-vue CLI install commands. Backed by registry search, not an LLM: responses are instant, repeatable, and free of hallucination.',
  version: '1.0.0',
  supportedInterfaces: [
    {
      url: `${SITE_URL}/a2a`,
      protocolBinding: 'JSONRPC',
      protocolVersion: '1.0',
    },
  ],
  provider: { organization: 'nxui', url: SITE_URL },
  documentationUrl: `${SITE_URL}/docs/mcp`,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    extendedAgentCard: false,
  },
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  skills: [
    {
      id: 'find-components',
      name: 'Find Vue components',
      description:
        'Search the nxui registry by keywords or a short description. Returns matching animated Vue components with title, description, docs URL, and the shadcn-vue CLI install command.',
      tags: ['vue', 'nuxt', 'ui-components', 'animation', 'search'],
      examples: [
        'shimmer button',
        'animated background for a hero section',
        'text animation that scrambles letters',
      ],
      inputModes: ['text/plain'],
      outputModes: ['text/plain'],
    },
  ],
};

function searchRegistry(query: string): RegistryIndexItem[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const items = getRegistryIndex().items;
  if (terms.length === 0) return [];

  return items
    .map((item) => {
      const haystack =
        `${item.name} ${item.title} ${item.description}`.toLowerCase();
      const score = terms.reduce(
        (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry) => entry.item);
}

function formatResults(query: string, items: RegistryIndexItem[]): string {
  if (items.length === 0) {
    return [
      `No nxui components match "${query}".`,
      `Browse the full catalog at ${SITE_URL}/docs or query the MCP server at ${SITE_URL}/mcp (list_components).`,
    ].join('\n');
  }
  return [
    `Found ${items.length} nxui component(s) matching "${query}":`,
    ...items.map((item) =>
      [
        `## ${item.title} (\`${item.name}\`)`,
        item.description,
        `Install: \`npx shadcn-vue@latest add ${SITE_URL}/r/${item.name}.json\``,
      ].join('\n'),
    ),
  ].join('\n\n');
}

const MAX_QUERY_LENGTH = 500;

// Stateless task identity: the task ID encodes the query (base64url), so
// GetTask can deterministically re-derive the same completed task on any
// isolate without a task store.
export function taskIdForQuery(query: string): string {
  const bytes = new TextEncoder().encode(query.slice(0, MAX_QUERY_LENGTH));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `task-${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function queryFromTaskId(taskId: string): string | null {
  if (!taskId.startsWith('task-')) return null;
  const b64 = taskId
    .slice(5)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil((taskId.length - 5) / 4) * 4, '=');
  try {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function runFindComponentsTask(
  query: string,
  userMessage?: A2aMessage,
): A2aTask {
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  const taskId = taskIdForQuery(trimmed);
  const contextId = `ctx-${taskId.slice(5, 21) || 'empty'}`;
  const timestamp = new Date().toISOString();

  if (!trimmed) {
    return {
      id: taskId,
      contextId,
      status: {
        state: 'TASK_STATE_INPUT_REQUIRED',
        message: {
          role: 'ROLE_AGENT',
          parts: [
            {
              text: 'Describe the component you are looking for, e.g. "shimmer button" or "animated hero background".',
            },
          ],
          messageId: `msg-${taskId.slice(5, 21) || 'empty'}`,
          taskId,
          contextId,
        },
        timestamp,
      },
    };
  }

  const artifact: A2aArtifact = {
    artifactId: `artifact-${taskId.slice(5, 21)}`,
    name: 'Component recommendations',
    parts: [{ text: formatResults(trimmed, searchRegistry(trimmed)) }],
  };

  return {
    id: taskId,
    contextId,
    status: { state: 'TASK_STATE_COMPLETED', timestamp },
    artifacts: [artifact],
    ...(userMessage ? { history: [userMessage] } : {}),
  };
}
