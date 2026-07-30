"use client";

import React from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useChat } from '../hooks/useChat';

export function ChatInterface() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    handleSubmit,
  } = useChat();

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden relative">
      {/* Premium subtle glow in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth z-10 relative">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start mb-6"
            >
              <div className="flex items-center space-x-3 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl rounded-tl-none px-6 py-4 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-sm font-medium text-slate-300 tracking-wide flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 mr-2" />
                  Menganalisis dokumen hukum...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-2xl border-t border-slate-700/50 z-20">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan mengenai hak Anda (contoh: pesangon PHK sepihak)..."
            className="w-full pl-6 pr-16 py-4 sm:py-5 rounded-full bg-slate-800 border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-200 text-[15px] sm:text-base shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 sm:right-3 p-3 sm:p-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
            aria-label="Kirim Pesan"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-[11px] sm:text-xs text-slate-500 font-light tracking-wide">
            AI dapat memberikan informasi yang kurang akurat. Pastikan untuk memverifikasi dengan ahli hukum.
          </p>
        </div>
      </div>
    </div>
  );
}
