"use client";

import React, { useState } from 'react';
import { Book, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CitationData } from '../domain/types';

export function Citation({ citation }: { citation: CitationData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-sm transition-colors hover:border-blue-500/30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left group"
      >
        <div className="flex items-center space-x-3 text-slate-300 group-hover:text-white transition-colors">
          <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
            <Book className="w-4 h-4" />
          </div>
          <span className="font-medium text-[13px] sm:text-sm tracking-wide">
            {citation.uu} <span className="text-slate-500 mx-1">•</span> {citation.pasal}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500 group-hover:text-slate-300"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 text-sm text-slate-300 bg-slate-950/30 border-t border-slate-700/50 leading-relaxed font-light">
              {citation.bab && (
                <div className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-widest flex items-center">
                  <div className="w-1 h-3 bg-blue-500 rounded-full mr-2"></div>
                  {citation.bab}
                </div>
              )}
              <p className="pl-3 border-l-2 border-slate-700 text-slate-200 italic">&quot;{citation.text}&quot;</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
