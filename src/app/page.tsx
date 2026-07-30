"use client";

import { useState } from "react";
import { DisclaimerModal } from "../components/DisclaimerModal";
import { ChatInterface } from "../components/ChatInterface";
import { Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  return (
    <main className="h-dvh flex flex-col relative overflow-hidden">
      {/* Premium Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-linear-to-br from-blue-500 to-emerald-500 text-white p-2.5 rounded-xl shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] border border-white/10">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TanyaHukum</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Asisten Legal Pekerja</p>
            </div>
          </div>
        </div>
      </header>

      {/* Background Decorators */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-28 pb-6 px-4 sm:px-6 relative z-10 h-full">
        <DisclaimerModal 
          isOpen={!hasAcceptedDisclaimer} 
          onAccept={() => setHasAcceptedDisclaimer(true)} 
        />
        
        <div className="flex-1 flex flex-col w-full h-full max-w-5xl mx-auto justify-center items-center">
          <AnimatePresence mode="wait">
            {hasAcceptedDisclaimer ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <ChatInterface />
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center p-6 bg-slate-800/50 backdrop-blur-md rounded-full mb-6 border border-slate-700/50 shadow-2xl">
                  <Scale className="w-16 h-16 text-blue-500/50" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-300 tracking-tight">
                  Menunggu Persetujuan...
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
