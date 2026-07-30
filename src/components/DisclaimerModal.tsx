"use client";

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden p-1"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-emerald-500/10 pointer-events-none" />
            
            <div className="relative bg-slate-900/90 rounded-[22px] p-6 sm:p-8">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">
                Pemberitahuan Penting
              </h2>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                TanyaHukum adalah asisten kecerdasan buatan (AI) yang dirancang untuk memberikan informasi umum terkait hukum ketenagakerjaan di Indonesia.
              </p>
              
              <div className="bg-slate-950/50 rounded-xl p-5 mb-8 border border-slate-800/50">
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  Informasi yang diberikan <strong className="text-red-400 font-medium">bukanlah pengganti penasihat hukum resmi</strong>. Untuk kasus spesifik atau kritis, sangat disarankan untuk berkonsultasi langsung dengan Disnaker atau Lembaga Bantuan Hukum (LBH).
                </p>
              </div>
              
              <button
                onClick={onAccept}
                className="w-full relative group overflow-hidden bg-white text-slate-900 font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <div className="relative flex items-center justify-center space-x-2">
                  <span>Saya Mengerti & Lanjutkan</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
