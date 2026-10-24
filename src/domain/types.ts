export interface CitationData {
  uu: string;
  pasal: string;
  bab?: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
}

export interface User {
  id: string;
  name: string;
  createdAt: string;
  /** Signed session token returned by login/register, stored in localStorage */
  token?: string;
}

export interface ChatSession {
  id: string;
  userId: string | null;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
