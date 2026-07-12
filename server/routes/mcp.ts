import type { H3Event } from 'h3';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolResult,
} from '~/types/mcp';

const PROTOCOL_VERSION = '2025-06-18';

function success(
  id: number | string | null,
  result: Record<string, unknown>,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function failure(
  id: number | string | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export default defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'access-control-allow-origin', '*');
  setResponseHeader(
    event,
    'access-control-allow-headers',
    'content-type, accept, mcp-session-id, mcp-protocol-version',
  );
  setResponseHeader(event, 'access-control-allow-methods', 'POST, OPTIONS');

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return null;
  }

  if (event.method === 'GET' || event.method === 'DELETE') {
    // Stateless server: no SSE stream to resume, no session to delete.
    setResponseStatus(event, 405);
    return { error: 'Method not allowed. POST JSON-RPC messages to /mcp.' };
  }

  if (event.method !== 'POST') {
    setResponseStatus(event, 405);
    return { error: 'Method not allowed.' };
  }

  const body = await readValidatedBody(
    event,
    (data: unknown): JsonRpcRequest | JsonRpcRequest[] => {
      if (typeof data !== 'object' || data === null) {
        throw new TypeError('JSON-RPC payload must be an object or array');
      }
      return data as JsonRpcRequest | JsonRpcRequest[];
    },
  );
  const messages = Array.isArray(body) ? body : [body];
  const responses: JsonRpcResponse[] = [];

  for (const message of messages) {
    if (!message || message.jsonrpc !== '2.0' || !message.method) {
      responses.push(failure(null, -32600, 'Invalid JSON-RPC request'));
      continue;
    }

    const id = message.id ?? null;

    if (message.method.startsWith('notifications/')) {
      continue;
    }

    if (message.method === 'initialize') {
      responses.push(
        success(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: MCP_SERVER_INFO,
          instructions:
            'nxui component registry. Use list_components to browse or search the 220+ animated Vue components, get_component for full source and install instructions, and get_install_command for the shadcn-vue CLI command.',
        }),
      );
      continue;
    }

    if (message.method === 'ping') {
      responses.push(success(id, {}));
      continue;
    }

    if (message.method === 'tools/list') {
      responses.push(success(id, { tools: MCP_TOOLS }));
      continue;
    }

    if (message.method === 'tools/call') {
      const params = message.params ?? {};
      const toolName = typeof params.name === 'string' ? params.name : '';
      const args =
        params.arguments && typeof params.arguments === 'object'
          ? (params.arguments as Record<string, unknown>)
          : {};
      let result: McpToolResult;
      try {
        result = await callMcpTool(event, toolName, args);
      } catch {
        result = {
          content: [{ type: 'text', text: 'Tool execution failed.' }],
          isError: true,
        };
      }
      responses.push(success(id, result as unknown as Record<string, unknown>));
      continue;
    }

    responses.push(failure(id, -32601, `Method not found: ${message.method}`));
  }

  trackPlausibleEvent(event, {
    eventName: 'MCP Request',
    url: 'https://nxui.geoql.in/mcp',
    props: { method: messages[0]?.method ?? 'unknown' },
  }).catch(() => {});

  if (responses.length === 0) {
    setResponseStatus(event, 202);
    return null;
  }

  setResponseHeader(event, 'content-type', 'application/json');
  return responses.length === 1 ? responses[0] : responses;
});
