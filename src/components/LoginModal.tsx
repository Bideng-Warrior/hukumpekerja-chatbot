"use client";

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../domain/types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await fetch(
          `/api/users?name=${encodeURIComponent(name.trim())}&password=${encodeURIComponent(password)}`
        );
        const data = await res.json();
        if (res.ok) {
          onLogin(data);
        } else {
          setError(data.error || 'Terjadi kesalahan. Coba lagi.');
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), password }),
        });
        const data = await res.json();
        if (res.ok) {
          onLogin(data);
        } else {
          setError(data.error || 'Gagal mendaftar. Coba lagi.');
        }
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
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
            className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white">
                {mode === 'login' ? 'Masuk' : 'Daftar Baru'}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="login-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan username..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white text-sm transition-all"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimal 6 karakter...' : 'Masukkan password...'}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white text-sm transition-all"
                    disabled={isLoading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || !password || isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 font-semibold text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}</span>
              </button>
            </form>

            {/* Toggle */}
            <div className="px-5 pb-5">
              <p className="text-center text-sm text-slate-400">
                {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                <button
                  onClick={switchMode}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
