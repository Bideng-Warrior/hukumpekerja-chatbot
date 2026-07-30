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
