export interface RegistryIndexItem {
  name: string;
  type: string;
  title: string;
  description: string;
}

export interface RegistryIndex {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryIndexItem[];
}

export interface RegistryItemFile {
  path: string;
  content: string;
  type: string;
  target: string;
}

export interface RegistryItem {
  $schema: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryItemFile[];
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: number | string | null;
  result: Record<string, unknown>;
}

export interface JsonRpcFailure {
  jsonrpc: '2.0';
  id: number | string | null;
  error: { code: number; message: string };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}
