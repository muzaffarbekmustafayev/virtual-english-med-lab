import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { RiMenuLine, RiHeartPulseLine } from 'react-icons/ri';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--bg, #f1f4f8)' }}>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f1c2e] border-b border-white/10 z-40 px-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
            aria-label="Open Navigation Menu"
          >
            <RiMenuLine />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <RiHeartPulseLine className="text-white text-base" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Virtual Patient</span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {user.full_name?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">
              {user.full_name?.split(' ')[0]}
            </span>
          </div>
        )}
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden animate-fade-in"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen w-full pt-14 md:pt-0 md:ml-[260px] transition-all overflow-x-hidden">
        <div className="px-4 py-5 sm:px-6 md:px-10 md:py-8 max-w-[1200px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
