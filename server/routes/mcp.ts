import { defineRouteMeta } from 'nitro';
import {
  defineHandler,
  readValidatedBody,
  setResponseStatus,
} from 'nuxt/server';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolResult,
} from '~/types/mcp';
import { MCP_SERVER_INFO, MCP_TOOLS, callMcpTool } from '../utils/mcp-tools';
import { trackOpenPanelEvent } from '../utils/openpanel';

const PROTOCOL_VERSION = '2025-06-18';

defineRouteMeta({
  openAPI: {
    tags: ['mcp'],
    summary: 'MCP JSON-RPC endpoint',
    description:
      'Stateless streamable-http Model Context Protocol server exposing the nxui component registry as tools. POST JSON-RPC 2.0 messages.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { type: 'object' } } },
    },
    responses: {
      200: {
        description: 'JSON-RPC response',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      405: { description: 'Method not allowed — POST JSON-RPC to /mcp' },
    },
  },
});

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

export default defineHandler(async (event) => {
  const headers = event.res.headers;
  headers.set('access-control-allow-origin', '*');
  headers.set('x-content-type-options', 'nosniff');
  headers.set(
    'access-control-allow-headers',
    'content-type, accept, mcp-session-id, mcp-protocol-version',
  );
  headers.set('access-control-allow-methods', 'POST, OPTIONS');

  const method = event.req.method;
  if (method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return null;
  }

  if (method === 'GET' || method === 'DELETE') {
    // Stateless server: no SSE stream to resume, no session to delete.
    setResponseStatus(event, 405);
    return { error: 'Method not allowed. POST JSON-RPC messages to /mcp.' };
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405);
    return { error: 'Method not allowed.' };
  }

  const body = await readValidatedBody(
    event,
    // An object or array passes through; anything else is a 400.
    (data: unknown): JsonRpcRequest | JsonRpcRequest[] | false =>
      typeof data === 'object' && data !== null
        ? (data as JsonRpcRequest | JsonRpcRequest[])
        : false,
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
            'nxui component registry. Use list_components to browse or search the 360+ animated Vue components, get_component for full source and install instructions, and get_install_command for the shadcn-vue CLI command.',
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

  trackOpenPanelEvent('mcp_request', {
    method: messages[0]?.method ?? 'unknown',
    url: 'https://nxui.geoql.in/mcp',
  }).catch(() => {});

  if (responses.length === 0) {
    setResponseStatus(event, 202);
    return null;
  }

  headers.set('content-type', 'application/json');
  return responses.length === 1 ? responses[0] : responses;
});
