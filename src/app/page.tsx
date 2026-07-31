"use client";

import { useState } from "react";
import { DisclaimerModal } from "../components/DisclaimerModal";
import { ChatInterface } from "../components/ChatInterface";
import { Sidebar } from "../components/Sidebar";
import { LoginModal } from "../components/LoginModal";
import { Scale, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "../domain/types";

export default function Home() {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentChatId(null);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleChatCreated = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <main className="h-dvh flex relative overflow-hidden bg-slate-950">
      {/* Background Decorators */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar (Desktop) */}
      <Sidebar
        user={user}
        currentChatId={currentChatId}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 h-full w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-linear-to-br from-blue-500 to-emerald-500 text-white p-2 rounded-xl shadow-lg border border-white/10">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">TanyaHukum</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 rounded-lg text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 flex flex-col w-full h-full p-4 sm:p-6 lg:p-8 justify-center items-center overflow-hidden">
          <DisclaimerModal 
            isOpen={!hasAcceptedDisclaimer} 
            onAccept={() => setHasAcceptedDisclaimer(true)} 
          />
          
          <AnimatePresence mode="wait">
            {hasAcceptedDisclaimer ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full max-w-4xl mx-auto flex flex-col"
              >
                <ChatInterface
                  userId={user?.id ?? null}
                  chatId={currentChatId}
                  onChatCreated={handleChatCreated}
                />
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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </main>
  );
}
