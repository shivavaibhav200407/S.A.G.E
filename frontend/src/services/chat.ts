import { request } from './api';
import type { ChatMessage } from '../types';

export interface ChatHistoryResponse {
  messages: Array<{
    id: number;
    user_message: string;
    ai_response: string;
    timestamp: string;
  }>;
}

export interface ChatSendResponse {
  response: string;
  ai_response: string;
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const data = await request<ChatHistoryResponse>('/api/chat/');
  const formatted: ChatMessage[] = [];
  if (data && data.messages) {
    for (const m of data.messages) {
      if (m.user_message) {
        formatted.push({
          id: `u-${m.id}`,
          role: 'user',
          content: m.user_message,
          timestamp: m.timestamp,
        });
      }
      if (m.ai_response) {
        formatted.push({
          id: `a-${m.id}`,
          role: 'assistant',
          content: m.ai_response,
          timestamp: m.timestamp,
        });
      }
    }
  }
  return formatted;
}

export async function sendMessage(message: string, topic?: string): Promise<string> {
  const data = await request<ChatSendResponse>('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, topic }),
  });
  return data.response || data.ai_response || '';
}
