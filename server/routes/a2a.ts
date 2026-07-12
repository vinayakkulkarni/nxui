import type { JsonRpcRequest, JsonRpcResponse } from '~/types/mcp';
import type { A2aMessage, A2aSendMessageParams } from '~/types/a2a';

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

function extractText(parts: unknown[]): string {
  return parts
    .map((part) => {
      if (part && typeof part === 'object' && 'text' in part) {
        const value = (part as { text: unknown }).text;
        return typeof value === 'string' ? value : '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function handleSendMessage(
  id: number | string | null,
  params: A2aSendMessageParams | undefined,
): JsonRpcResponse {
  const message = params?.message;
  if (!message || !Array.isArray(message.parts)) {
    return failure(id, -32602, 'Invalid parameters: message.parts required');
  }

  const query = extractText(message.parts);
  const userMessage: A2aMessage = {
    role: 'ROLE_USER',
    parts: [{ text: query }],
    messageId:
      typeof message.messageId === 'string' && message.messageId
        ? message.messageId
        : `msg-${crypto.randomUUID()}`,
  };

  return success(id, { task: runFindComponentsTask(query, userMessage) });
}

function handleGetTask(
  id: number | string | null,
  params: Record<string, unknown> | undefined,
): JsonRpcResponse {
  const taskId = typeof params?.id === 'string' ? params.id : '';
  const query = queryFromTaskId(taskId);
  if (query === null) {
    return failure(id, -32001, `Task "${taskId}" not found`);
  }
  return success(id, { task: runFindComponentsTask(query) });
}

const UNSUPPORTED = [
  'SendStreamingMessage',
  'SubscribeToTask',
  'CreateTaskPushNotificationConfig',
  'GetTaskPushNotificationConfig',
  'ListTaskPushNotificationConfigs',
  'DeleteTaskPushNotificationConfig',
  'GetExtendedAgentCard',
];

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'access-control-allow-origin', '*');
  setResponseHeader(
    event,
    'access-control-allow-headers',
    'content-type, accept, a2a-version, a2a-extensions',
  );
  setResponseHeader(event, 'access-control-allow-methods', 'POST, OPTIONS');

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return null;
  }

  if (event.method !== 'POST') {
    setResponseStatus(event, 405);
    return {
      error:
        'Method not allowed. POST JSON-RPC messages to /a2a (see /.well-known/agent-card.json).',
    };
  }

  const body = await readBody<JsonRpcRequest>(event).catch(() => null);
  if (!body || body.jsonrpc !== '2.0' || !body.method) {
    return failure(null, -32600, 'Request payload validation error');
  }

  const id = body.id ?? null;
  const method = body.method;

  // PascalCase per A2A v1.0 JSON-RPC binding; slash-style aliases accepted
  // for pre-1.0 clients (message/send era).
  if (method === 'SendMessage' || method === 'message/send') {
    return handleSendMessage(id, body.params as A2aSendMessageParams);
  }
  if (method === 'GetTask' || method === 'tasks/get') {
    return handleGetTask(id, body.params);
  }
  if (method === 'ListTasks' || method === 'tasks/list') {
    // Stateless agent: tasks are derivable from their IDs, not enumerable.
    return success(id, { tasks: [], nextPageToken: '' });
  }
  if (method === 'CancelTask' || method === 'tasks/cancel') {
    // Every task completes synchronously inside SendMessage, so by the time
    // a cancel arrives the task is already terminal — not cancelable.
    return failure(id, -32002, 'Task cannot be canceled: already completed');
  }
  if (UNSUPPORTED.includes(method)) {
    return failure(id, -32004, `Operation "${method}" is not supported`);
  }

  return failure(id, -32601, 'Method not found');
});
