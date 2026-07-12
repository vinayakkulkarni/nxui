export interface A2aAgentInterface {
  url: string;
  protocolBinding: 'JSONRPC' | 'GRPC' | 'HTTP+JSON';
  protocolVersion: string;
}

export interface A2aAgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes: string[];
  outputModes: string[];
}

export interface A2aAgentCard {
  name: string;
  description: string;
  version: string;
  supportedInterfaces: A2aAgentInterface[];
  provider: { organization: string; url: string };
  documentationUrl: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: A2aAgentSkill[];
}

export type A2aTaskState =
  | 'TASK_STATE_SUBMITTED'
  | 'TASK_STATE_WORKING'
  | 'TASK_STATE_INPUT_REQUIRED'
  | 'TASK_STATE_COMPLETED'
  | 'TASK_STATE_FAILED'
  | 'TASK_STATE_CANCELED'
  | 'TASK_STATE_REJECTED';

export interface A2aTextPart {
  text: string;
}

export interface A2aMessage {
  role: 'ROLE_USER' | 'ROLE_AGENT';
  parts: A2aTextPart[];
  messageId: string;
  taskId?: string;
  contextId?: string;
}

export interface A2aArtifact {
  artifactId: string;
  name: string;
  parts: A2aTextPart[];
}

export interface A2aTaskStatus {
  state: A2aTaskState;
  message?: A2aMessage;
  timestamp: string;
}

export interface A2aTask {
  id: string;
  contextId: string;
  status: A2aTaskStatus;
  artifacts?: A2aArtifact[];
  history?: A2aMessage[];
}

export interface A2aSendMessageParams {
  message?: {
    role?: string;
    parts?: unknown[];
    messageId?: string;
    contextId?: string;
  };
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
