"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../domain/types';
import { sendMessage } from '../services/chatService';

interface UseChatOptions {
  userId: string | null;
  chatId: string | null;
  onChatCreated?: (chatId: string) => void;
}

export function useChat({ userId, chatId, onChatCreated }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Halo! Saya asisten AI TanyaHukum. Anda bisa berkonsultasi mengenai hak-hak pekerja, seperti aturan pesangon, kontrak kerja, atau uang lembur.'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChatIdRef = useRef<string | null>(chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sync chatId ref
  useEffect(() => {
    currentChatIdRef.current = chatId;
  }, [chatId]);

  // Load existing chat messages when chatId changes
  const loadChat = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chats?userId=${userId}`);
      if (res.ok) {
        const chats = await res.json();
        const chat = chats.find((c: { id: string }) => c.id === id);
        if (chat && chat.messages.length > 0) {
          setMessages(chat.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (chatId && userId) {
      loadChat(chatId);
    } else {
      // Reset to welcome message for new chats
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Halo! Saya asisten AI TanyaHukum. Anda bisa berkonsultasi mengenai hak-hak pekerja, seperti aturan pesangon, kontrak kerja, atau uang lembur.'
      }]);
    }
  }, [chatId, userId, loadChat]);

  const persistMessages = async (allMessages: ChatMessage[], title: string) => {
    if (!userId) return; // Guest mode: skip persistence

    try {
      if (currentChatIdRef.current) {
        // Update existing chat
        await fetch(`/api/chats/${currentChatIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages }),
        });
      } else {
        // Create new chat
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, title, messages: allMessages }),
        });
        if (res.ok) {
          const newChat = await res.json();
          currentChatIdRef.current = newChat.id;
          onChatCreated?.(newChat.id);
        }
      }
    } catch (error) {
      console.error('Failed to persist messages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
    };

    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessage(userQuery, newHistory);
      const finalMessages = [...newHistory, aiResponse];
      setMessages(finalMessages);

      // Persist after AI responds (use first user message as title)
      const title = messages.length <= 1 
        ? userQuery.substring(0, 100) 
        : messages.find(m => m.role === 'user')?.content.substring(0, 100) || 'Chat Baru';
      await persistMessages(finalMessages, title);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    currentChatIdRef.current = null;
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya asisten AI TanyaHukum. Anda bisa berkonsultasi mengenai hak-hak pekerja, seperti aturan pesangon, kontrak kerja, atau uang lembur.'
    }]);
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSubmit,
    resetChat,
  };
}
