"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Server, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<'ngrok' | 'gemini'>('ngrok');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedProvider = localStorage.getItem('ai_provider') as 'ngrok' | 'gemini' | null;
      const savedEndpoint = localStorage.getItem('custom_endpoint');
      
      if (savedProvider) setProvider(savedProvider);
      
      // Default to the .env endpoint if local storage is empty
      if (savedEndpoint !== null) {
        setCustomEndpoint(savedEndpoint);
      } else {
        setCustomEndpoint(process.env.NEXT_PUBLIC_AI_ENDPOINT || '');
      }
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('custom_endpoint', customEndpoint.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Server className="w-5 h-5 mr-2 text-blue-400" />
                Pengaturan AI
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Pilih Mesin AI (AI Engine)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProvider('ngrok')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      provider === 'ngrok'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Server className="w-6 h-6 mb-2" />
                    <span className="text-sm font-semibold">Llama 3 (Ngrok)</span>
                  </button>
                  <button
                    onClick={() => setProvider('gemini')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      provider === 'gemini'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Cpu className="w-6 h-6 mb-2" />
                    <span className="text-sm font-semibold">Gemini API</span>
                  </button>
                </div>
              </div>

              {/* Ngrok URL Input (Only visible if Ngrok is selected) */}
              <AnimatePresence>
                {provider === 'ngrok' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="endpoint" className="block text-sm font-medium text-slate-300 mb-2 mt-4">
                      Custom Ngrok URL
                    </label>
                    <input
                      id="endpoint"
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="https://...ngrok-free.dev/api/chat"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white text-sm transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      URL Ngrok sering berubah setiap kali Colab di-restart. Anda bisa mengupdatenya di sini tanpa mengubah file .env.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {provider === 'gemini' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm text-emerald-200">
                        Mode Gemini akan menggunakan Hugging Face Inference API untuk pencarian dokumen (RAG) secara gratis, dan Gemini Flash untuk menyusun jawaban. Sangat cocok jika Ngrok sedang offline.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl transition-all font-semibold text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
