import React, { useState } from 'react';
import { Plus, MessageSquare, User, Settings, Scale, LogIn, Lock } from 'lucide-react';

const mockChats = [
  { id: '1', title: 'Pertanyaan Pesangon PHK', date: 'Hari ini' },
  { id: '2', title: 'Aturan Lembur 2024', date: 'Kemarin' },
  { id: '3', title: 'Kontrak PKWT', date: 'Minggu lalu' },
];

export function Sidebar() {
  // Mock login state for UI demonstration
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="w-72 h-full hidden md:flex flex-col bg-slate-900/60 backdrop-blur-2xl border-r border-slate-700/50 relative z-40">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-linear-to-br from-blue-500 to-emerald-500 text-white p-2 rounded-xl shadow-lg border border-white/10">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">TanyaHukum</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Asisten Legal</p>
          </div>
        </div>

        <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          <span className="font-semibold text-sm">Chat Baru</span>
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Riwayat Chat</h3>
        
        {isLoggedIn ? (
          <div className="space-y-1">
            {mockChats.map((chat) => (
              <button 
                key={chat.id}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors group"
              >
                <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-slate-300 font-medium truncate group-hover:text-white">{chat.title}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 opacity-70">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">Riwayat Tidak Tersedia</p>
            <p className="text-xs text-slate-500">Silakan login untuk menyimpan dan melihat riwayat percakapan Anda.</p>
          </div>
        )}
      </div>

      {/* User / Authentication Area */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/40">
        {isLoggedIn ? (
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/40">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-300 font-medium group-hover:text-white">Budi</p>
              <p className="text-[11px] text-slate-500">Pekerja</p>
            </div>
            <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>
        ) : (
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 rounded-xl transition-colors border border-slate-700/50"
          >
            <LogIn className="w-4 h-4" />
            <span className="font-medium text-sm">Masuk / Daftar</span>
          </button>
        )}
      </div>
    </div>
  );
}
