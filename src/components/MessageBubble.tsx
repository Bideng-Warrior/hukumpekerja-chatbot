import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../domain/types';
import { cn } from '../lib/utils';
import { Citation } from './Citation';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-8",
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn(
        "flex max-w-[90%] sm:max-w-[80%]",
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className={cn(
          "shrink-0 flex items-start",
          isUser ? 'ml-4' : 'mr-4'
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-1",
            isUser 
              ? 'bg-blue-600 ring-blue-500/50 text-white shadow-blue-500/20' 
              : 'bg-emerald-600 ring-emerald-500/50 text-white shadow-emerald-500/20'
          )}>
            {isUser ? <User className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex flex-col min-w-0">
          <div className={cn(
            "px-5 py-4 shadow-md backdrop-blur-sm",
            isUser 
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-900/20 border border-blue-500' 
              : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm shadow-black/20 border border-slate-700/60'
          )}>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-light tracking-wide">
              {message.content}
            </div>
          </div>
          
          {/* Citations */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex flex-col"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1 mb-1">
                Sumber Referensi Hukum
              </span>
              <div className="space-y-2">
                {message.citations.map((citation, index) => (
                  <Citation key={index} citation={citation} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
