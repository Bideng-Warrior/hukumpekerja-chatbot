import { ChatMessage, CitationData } from '../domain/types';

const FALLBACK_MESSAGE = "Mohon maaf, layanan AI saat ini sedang tidak tersedia atau sibuk. Silakan coba beberapa saat lagi, atau hubungi Disnaker/LBH terdekat untuk bantuan darurat.";

export async function sendMessage(query: string, history: ChatMessage[]): Promise<ChatMessage> {
  // Use the internal Next.js API proxy to bypass CORS
  const endpoint = '/api/chat';

  try {
    // Format history to provide context, excluding welcome message and the current query
    const historyString = history
      .slice(0, -1) // remove the last message (current query)
      .filter(m => m.id !== 'welcome') // ignore hardcoded welcome
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send query and history to our Next.js API
      body: JSON.stringify({
        query: query,
        history: historyString,
        retrieved_context: "" // Handled by Next.js API
      }),
    });

    if (!response.ok) {
      throw new Error(`Proxy responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Map to FastAPI response: {"query": "...", "jawaban_model": "..."}
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.jawaban_model || FALLBACK_MESSAGE,
      citations: [],
    };

  } catch (error) {
    console.error('Error communicating with internal chat proxy:', error);
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: FALLBACK_MESSAGE,
      citations: [],
    };
  }
}
