"use client";

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../domain/types';
import { sendMessage } from '../services/chatService';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Halo! Saya asisten AI TanyaHukum. Anda bisa berkonsultasi mengenai hak-hak pekerja, seperti aturan pesangon, kontrak kerja, atau uang lembur.'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      setMessages([...newHistory, aiResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSubmit,
  };
}
