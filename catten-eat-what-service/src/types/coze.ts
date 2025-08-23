export interface CozeConfig {
  apiKey: string;
  botId: string;
  apiEndpoint: string;
}

export interface CozeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CozeError {
  code: number;
  msg: string;
}

export interface CozeUsage {
  token_count: number;
  output_count: number;
  input_count: number;
}

export type ChatStatus =
  | 'created'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'requires_action'
  | 'canceled';

export interface ChatObject {
  id: string;
  conversation_id: string;
  bot_id: string;
  created_at?: number;
  completed_at?: number;
  failed_at?: number;
  meta_data?: Record<string, string>;
  last_error?: CozeError | null;
  status: ChatStatus;
  required_action?: any;
  usage?: CozeUsage;
}

export interface ChatResponse {
  code: number;
  msg: string;
  data: ChatObject;
}

export type MessageRole = 'user' | 'assistant';
export type MessageContentType = 'text' | 'object_string' | 'card';
export type MessageType =
  | 'answer'
  | 'function_call'
  | 'tool_output'
  | 'tool_response'
  | 'follow_up'
  | 'verbose';

export interface MessageObject {
  id: string;
  conversation_id: string;
  bot_id?: string;
  chat_id?: string;
  meta_data?: Record<string, string>;
  role: MessageRole;
  content: string;
  content_type: MessageContentType;
  created_at: number;
  updated_at: number;
  type: MessageType;
}

export interface MessageListResponse {
  code: number;
  msg: string;
  data: MessageObject[];
}

export interface CozeRequestBody {
  bot_id: string;
  user_id: string;
  additional_messages?: CozeMessage[];
  stream?: boolean;
  custom_variables?: Record<string, any>;
  auto_save_history?: boolean;
  meta_data?: Record<string, string>;
  extra_params?: Record<string, any>;
}

export interface CozeStreamResponse {
  id: string;
  created: number;
  choices: Array<{
    delta: {
      role?: string;
      content?: string;
    };
  }>;
}

// 为了保持向后兼容
export type CozeResponse = ChatResponse;
