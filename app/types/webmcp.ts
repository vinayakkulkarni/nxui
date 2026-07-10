export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
  provideContext?: (context: { tools: WebMcpTool[] }) => void;
}
