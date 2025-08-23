import {
  CozeConfig,
  CozeMessage,
  CozeResponse,
  CozeStreamResponse,
  ChatStatus,
  CozeRequestBody,
  MessageListResponse,
  MessageObject,
  MessageType,
  ChatResponse,
} from '../types/coze';

const POLLING_INTERVAL = 1000; // 1秒
const MAX_POLLING_ATTEMPTS = 300; // 最大轮询次数

export class CozeService {
  private config: CozeConfig;

  constructor(config: CozeConfig) {
    this.config = config;
  }

  async createCompletion(
    messages: CozeMessage[],
    userId?: string,
    options: Partial<
      Omit<CozeRequestBody, 'bot_id' | 'user_id' | 'additional_messages'>
    > = {}
  ): Promise<ChatResponse> {
    // 1. 发起对话
    const requestBody: CozeRequestBody = {
      bot_id: this.config.botId,
      user_id: userId || 'recommendation-user',
      additional_messages: messages,
      stream: false,
      auto_save_history: true,
      ...options,
    };

    console.log('requestBody', requestBody);

    const response = await fetch(`${this.config.apiEndpoint}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API error: ${response.status} - ${errorText}`);
    }

    const chatResponse = (await response.json()) as ChatResponse;
    if (chatResponse.code !== 0) {
      throw new Error(`API error: ${chatResponse.msg}`);
    }

    return chatResponse;
  }

  async waitForCompletion(
    conversationId: string,
    chatId: string
  ): Promise<ChatResponse> {
    let attempts = 0;
    while (attempts < MAX_POLLING_ATTEMPTS) {
      const status = await this.getConversationStatus(conversationId, chatId);
      console.log('status', status);
      if (
        status.data.status === 'completed' ||
        status.data.status === 'failed'
      ) {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
      attempts++;
    }

    throw new Error('Conversation polling timeout');
  }

  private async getConversationStatus(
    conversationId: string,
    chatId: string
  ): Promise<ChatResponse> {
    const response = await fetch(
      `${this.config.apiEndpoint}/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get conversation status: ${response.statusText}`
      );
    }

    const data = (await response.json()) as ChatResponse;
    console.log('data', data);
    if (data.code !== 0) {
      throw new Error(`Failed to get status: ${data.msg}`);
    }

    return data;
  }

  async getMessages(
    conversationId: string,
    chatId: string,
    messageType?: MessageType
  ): Promise<MessageListResponse> {
    const response = await fetch(
      `${this.config.apiEndpoint}/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`);
    }

    const messageList = (await response.json()) as MessageListResponse;
    if (messageList.code !== 0) {
      throw new Error(`Failed to get messages: ${messageList.msg}`);
    }

    // 如果指定了消息类型，过滤消息
    if (messageType) {
      messageList.data = messageList.data.filter(
        (msg) => msg.type === messageType
      );
    }

    return messageList;
  }

  async getAnswerMessage(
    conversationId: string,
    chatId: string
  ): Promise<MessageObject | null> {
    const messages = await this.getMessages(conversationId, chatId, 'answer');
    return messages.data[0] || null;
  }

  async createStreamCompletion(
    messages: CozeMessage[],
    onChunk: (chunk: CozeStreamResponse) => void,
    userId: string,
    options: Partial<
      Omit<
        CozeRequestBody,
        'bot_id' | 'user_id' | 'additional_messages' | 'stream'
      >
    > = {}
  ): Promise<void> {
    const requestBody: CozeRequestBody = {
      bot_id: this.config.botId,
      user_id: userId,
      additional_messages: messages,
      stream: true,
      ...options,
    };

    const response = await fetch(`${this.config.apiEndpoint}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          try {
            const jsonStr = trimmedLine.replace(/^data: /, '');
            const parsedChunk = JSON.parse(jsonStr) as CozeStreamResponse;
            onChunk(parsedChunk);
          } catch (e) {
            console.error('Error parsing chunk:', e, 'Line:', line);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const jsonStr = buffer.trim().replace(/^data: /, '');
          if (jsonStr !== '[DONE]') {
            const parsedChunk = JSON.parse(jsonStr) as CozeStreamResponse;
            onChunk(parsedChunk);
          }
        } catch (e) {
          console.error('Error parsing final chunk:', e);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
